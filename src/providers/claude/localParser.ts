// DESIGN: v2-local-estimation-design.md
// AGENTS: err->try-catch | retention->dataRetentionDays | disk-OK
// 🔀 Provider boundary: JSONL path and format are Claude-specific.

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { ILocalUsageProvider, UnifiedUsageEntry, RateLimits } from '../base/types';
import { log } from '../../utils';

const PROJECTS_DIR = path.join(os.homedir(), '.claude', 'projects');

interface FileState {
  mtimeMs: number;
  size: number;
  entries: UnifiedUsageEntry[];
}

interface JsonlEntry {
  type: string;
  timestamp: string;
  requestId?: string;
  message?: {
    id?: string;
    model?: string;
    usage?: {
      input_tokens: number;
      output_tokens: number;
      cache_read_input_tokens: number;
      cache_creation_input_tokens: number;
    };
  };
}

export class ClaudeLocalParser implements ILocalUsageProvider {
  private fileStates = new Map<string, FileState>();

  async scanSessions(opts?: {
    window5hStartMs?: number;
    window7dStartMs?: number;
    dataRetentionDays?: number;
    force?: boolean;
  }): Promise<UnifiedUsageEntry[]> {
    const files = await this.findAllJsonlFiles();

    // Remove stale fileStates for deleted files
    const currentFiles = new Set(files);
    for (const [fp] of this.fileStates) {
      if (!currentFiles.has(fp)) {
        this.fileStates.delete(fp);
      }
    }

    const entries: UnifiedUsageEntry[] = [];
    const seenMessageIds = new Set<string>();
    const retentionDays = opts?.dataRetentionDays ?? 365;
    const retentionStart = Date.now() - retentionDays * 24 * 3600 * 1000;

    for (const filePath of files) {
      const fileState = await this.updateFileState(filePath);
      for (const entry of fileState.entries) {
        if (entry.messageId) {
          if (seenMessageIds.has(entry.messageId)) continue;
          seenMessageIds.add(entry.messageId);
        }
        if (entry.timestamp < retentionStart) continue;
        entries.push(entry);
      }
    }

    return entries;
  }

  async getRateLimits(): Promise<RateLimits | null> {
    // Claude local JSONL does not contain rate_limits
    return null;
  }

  invalidate(): void {
    this.fileStates.clear();
  }

  private async updateFileState(filePath: string): Promise<FileState> {
    const existing = this.fileStates.get(filePath);

    let stat: { mtimeMs: number; size: number };
    try {
      const s = await fs.stat(filePath);
      stat = { mtimeMs: s.mtimeMs, size: s.size };
    } catch {
      return existing ?? { mtimeMs: 0, size: 0, entries: [] };
    }

    if (existing && existing.mtimeMs === stat.mtimeMs && existing.size === stat.size) {
      return existing;
    }

    let text: string;
    try {
      text = await fs.readFile(filePath, 'utf-8');
    } catch {
      return existing ?? { mtimeMs: stat.mtimeMs, size: stat.size, entries: [] };
    }

    const newEntries = this.parseText(text);
    const fileState: FileState = { mtimeMs: stat.mtimeMs, size: stat.size, entries: newEntries };
    this.fileStates.set(filePath, fileState);
    return fileState;
  }

  private parseText(text: string): UnifiedUsageEntry[] {
    const entries: UnifiedUsageEntry[] = [];
    const lines = text.split(/\r?\n/);
    const seenRequestIds = new Set<string>();

    for (const line of lines) {
      if (!line.trim()) continue;
      const entry = this.parseLine(line, seenRequestIds);
      if (entry) entries.push(entry);
    }
    return entries;
  }

  private parseLine(line: string, seenRequestIds: Set<string>): UnifiedUsageEntry | null {
    try {
      const json = JSON.parse(line) as JsonlEntry;
      if (json.type !== 'assistant' || !json.timestamp || !json.message?.usage) {
        return null;
      }

      // Deduplicate by requestId or message.id (same request may have multiple content blocks)
      const dedupeKey = json.requestId || json.message.id || null;
      if (dedupeKey) {
        if (seenRequestIds.has(dedupeKey)) return null;
        seenRequestIds.add(dedupeKey);
      }

      const usage = json.message.usage;
      const timestamp = new Date(json.timestamp).getTime();
      if (isNaN(timestamp)) return null;

      return {
        timestamp,
        inputOther: usage.input_tokens || 0,
        output: usage.output_tokens || 0,
        inputCacheRead: usage.cache_read_input_tokens || 0,
        inputCacheCreation: usage.cache_creation_input_tokens || 0,
        cost: 0, // cost is calculated later by LocalUsageService using provider pricing
        messageId: json.message.id ?? null,
        model: json.message.model ?? undefined,
      };
    } catch {
      return null;
    }
  }

  private async findAllJsonlFiles(): Promise<string[]> {
    const results: string[] = [];
    try {
      const projectDirs = await fs.readdir(PROJECTS_DIR, { withFileTypes: true });
      for (const dir of projectDirs) {
        if (!dir.isDirectory()) continue;
        const dirPath = path.join(PROJECTS_DIR, dir.name);
        try {
          const entries = await fs.readdir(dirPath);
          for (const entry of entries) {
            if (entry.endsWith('.jsonl')) {
              results.push(path.join(dirPath, entry));
            }
          }
        } catch {
          // skip unreadable dirs
        }
      }
    } catch {
      // ~/.claude/projects doesn't exist
    }
    return results;
  }
}

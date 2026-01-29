import {
  Action,
  ActionPanel,
  Alert,
  Color,
  confirmAlert,
  Detail,
  Icon,
  List,
  getPreferenceValues,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { execFile } from "child_process";
import { useEffect, useState } from "react";
import { clearHistory, formatRelativeTime, getHistory, HistoryEntry, removeFromHistory } from "./storage";

interface Preferences {
  pythonPath: string;
}

interface RunResult {
  stdout: string;
  stderr: string;
  error?: string;
}

function ResultView({ result }: { result: RunResult }) {
  const { pop } = useNavigation();
  let markdown = "";

  if (result.error) {
    markdown += `## Error\n\n\`\`\`\n${result.error}\n\`\`\`\n\n`;
  }
  if (result.stdout) {
    markdown += `## Output\n\n\`\`\`\n${result.stdout}\n\`\`\`\n\n`;
  }
  if (result.stderr) {
    markdown += `## Stderr\n\n\`\`\`\n${result.stderr}\n\`\`\`\n\n`;
  }
  if (!result.stdout && !result.stderr && !result.error) {
    markdown = "*No output*";
  }

  const copyText = result.stdout || result.stderr || result.error || "";

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Output" content={copyText} />
          <Action title="Back" onAction={() => pop()} />
        </ActionPanel>
      }
    />
  );
}

export default function HistoryCommand() {
  const { push } = useNavigation();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadHistory() {
    setEntries(await getHistory());
    setIsLoading(false);
  }

  useEffect(() => {
    loadHistory();
  }, []);

  function runCode(code: string) {
    const { pythonPath } = getPreferenceValues<Preferences>();
    const python = pythonPath || "python3";

    showToast({ style: Toast.Style.Animated, title: "Running Python..." });

    execFile(python, ["-c", code], { timeout: 10_000 }, (error, stdout, stderr) => {
      const result: RunResult = { stdout, stderr };

      if (error) {
        if (error.killed) {
          result.error = "Execution timed out (10 second limit)";
        } else if (!stderr) {
          result.error = error.message;
        }
      }

      if (result.error || result.stderr) {
        showToast({ style: Toast.Style.Failure, title: "Execution finished with errors" });
      } else {
        showToast({ style: Toast.Style.Success, title: "Execution complete" });
      }

      push(<ResultView result={result} />);
    });
  }

  async function handleDelete(entry: HistoryEntry) {
    await removeFromHistory(entry.timestamp);
    await loadHistory();
    showToast({ style: Toast.Style.Success, title: "Entry removed" });
  }

  async function handleClearAll() {
    if (
      await confirmAlert({
        title: "Clear All History",
        message: "This will remove all history entries. This cannot be undone.",
        primaryAction: { title: "Clear All", style: Alert.ActionStyle.Destructive },
      })
    ) {
      await clearHistory();
      await loadHistory();
      showToast({ style: Toast.Style.Success, title: "History cleared" });
    }
  }

  return (
    <List isLoading={isLoading}>
      {entries.length === 0 && !isLoading ? (
        <List.EmptyView title="No History" description="Run some Python code to see it here." />
      ) : (
        entries.map((entry) => (
          <List.Item
            key={entry.timestamp}
            title={entry.code.split("\n")[0].slice(0, 80)}
            subtitle={entry.code.includes("\n") ? "…" : undefined}
            accessories={[{ text: formatRelativeTime(entry.timestamp), icon: Icon.Clock }]}
            actions={
              <ActionPanel>
                <Action title="Run" icon={Icon.Play} onAction={() => runCode(entry.code)} />
                <Action.CopyToClipboard title="Copy Code" content={entry.code} />
                <Action
                  title="Delete"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  shortcut={{ modifiers: ["ctrl"], key: "x" }}
                  onAction={() => handleDelete(entry)}
                />
                <Action
                  title="Clear All History"
                  icon={Icon.ExclamationMark}
                  style={Action.Style.Destructive}
                  shortcut={{ modifiers: ["ctrl", "shift"], key: "x" }}
                  onAction={handleClearAll}
                />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}

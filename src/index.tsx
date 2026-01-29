import { Action, ActionPanel, Form, Icon, List, getPreferenceValues, showToast, Toast, useNavigation } from "@raycast/api";
import { execFile } from "child_process";
import { useEffect, useState } from "react";
import { addToHistory, formatRelativeTime, getHistory, HistoryEntry } from "./storage";

interface Preferences {
  pythonPath: string;
}

interface RunResult {
  stdout: string;
  stderr: string;
  error?: string;
}

function HistoryPicker({ onSelect }: { onSelect: (code: string) => void }) {
  const { pop } = useNavigation();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getHistory().then((h) => {
      setEntries(h);
      setIsLoading(false);
    });
  }, []);

  return (
    <List isLoading={isLoading}>
      {entries.length === 0 && !isLoading ? (
        <List.EmptyView title="No History" description="Run some Python code first." />
      ) : (
        entries.map((entry) => (
          <List.Item
            key={entry.timestamp}
            title={entry.code.split("\n")[0].slice(0, 80)}
            subtitle={entry.code.includes("\n") ? "…" : undefined}
            accessories={[{ text: formatRelativeTime(entry.timestamp), icon: Icon.Clock }]}
            actions={
              <ActionPanel>
                <Action
                  title="Insert"
                  icon={Icon.Text}
                  onAction={() => {
                    onSelect(entry.code);
                    pop();
                  }}
                />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}

export default function Command() {
  const { push } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<RunResult | null>(null);

  function runPython(code: string) {
    const { pythonPath } = getPreferenceValues<Preferences>();
    const python = pythonPath || "python3";

    setIsLoading(true);
    setResult(null);
    showToast({ style: Toast.Style.Animated, title: "Running Python..." });

    execFile(python, ["-c", code], { timeout: 10_000 }, (error, stdout, stderr) => {
      setIsLoading(false);

      const r: RunResult = { stdout, stderr };

      if (error) {
        if (error.killed) {
          r.error = "Execution timed out (10 second limit)";
        } else if (!stderr) {
          r.error = error.message;
        }
      }

      if (r.error || r.stderr) {
        showToast({ style: Toast.Style.Failure, title: "Execution finished with errors" });
      } else {
        showToast({ style: Toast.Style.Success, title: "Execution complete" });
      }

      setResult(r);
    });
  }

  const outputText = result
    ? result.error || result.stderr || result.stdout || "(no output)"
    : "";

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Run Code"
            onSubmit={(values: { code: string }) => {
              if (!values.code.trim()) {
                showToast({ style: Toast.Style.Failure, title: "Please enter some Python code" });
                return;
              }
              addToHistory(values.code);
              runPython(values.code);
            }}
          />
          {result && (
            <Action.CopyToClipboard
              title="Copy Output"
              content={outputText}
              shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
            />
          )}
          <Action
            title="New Snippet"
            icon={Icon.NewDocument}
            shortcut={{ modifiers: ["cmd"], key: "n" }}
            onAction={() => {
              setCode("");
              setResult(null);
            }}
          />
          <Action
            title="Insert from History"
            icon={Icon.Clock}
            shortcut={{ modifiers: ["cmd"], key: "h" }}
            onAction={() => push(<HistoryPicker onSelect={setCode} />)}
          />
        </ActionPanel>
      }
    >
      <Form.TextArea id="code" title="Python Code" placeholder="print('Hello, World!')" value={code} onChange={setCode} />
      {result && (
        <>
          <Form.Separator />
          {result.error && <Form.Description title="Error" text={result.error} />}
          {result.stdout && <Form.Description title="Output" text={result.stdout} />}
          {result.stderr && <Form.Description title="Stderr" text={result.stderr} />}
          {!result.stdout && !result.stderr && !result.error && (
            <Form.Description title="Output" text="(no output)" />
          )}
          <Form.Description title="" text="⌘N — New Snippet" />
        </>
      )}
    </Form>
  );
}

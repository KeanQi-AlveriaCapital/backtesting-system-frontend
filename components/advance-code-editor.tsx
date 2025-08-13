"use client";

import Editor from "@monaco-editor/react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Copy, Download, RotateCcw, Code, Upload } from "lucide-react";
import { toast } from "sonner";

interface CodeEditorProps {
  defaultLanguage?: "python" | "cpp" | "javascript" | "typescript";
  defaultValue?: string;
  onChange?: (value: string, language: string) => void;
  onRun?: (code: string, language: string) => void;
  height?: string;
  className?: string;
  showToolbar?: boolean;
}

const LANGUAGE_OPTIONS = [
  { value: "python", label: "Python", extension: ".py", icon: "🐍" },
  { value: "cpp", label: "C++", extension: ".cpp", icon: "⚡" },
] as const;

const DEFAULT_PYTHON_CODE = `# Your backtesting strategy
import pandas as pd
import numpy as np

class TradingStrategy:
    def __init__(self, initial_capital=100000):
        self.initial_capital = initial_capital
        self.positions = pd.DataFrame()
        
    def generate_signals(self, data):
        """
        Generate trading signals based on your strategy
        
        Args:
            data: DataFrame with OHLCV data
            
        Returns:
            signals: DataFrame with buy/sell signals
        """
        signals = pd.DataFrame(index=data.index)
        signals['price'] = data['close']
        signals['signal'] = 0.0
        
        # Example: Simple moving average crossover
        short_window = 40
        long_window = 100
        
        signals['short_mavg'] = data['close'].rolling(window=short_window).mean()
        signals['long_mavg'] = data['close'].rolling(window=long_window).mean()
        
        # Generate signals
        signals['signal'][short_window:] = np.where(
            signals['short_mavg'][short_window:] > signals['long_mavg'][short_window:], 
            1.0, 
            0.0
        )
        
        signals['positions'] = signals['signal'].diff()
        
        return signals
    
    def backtest(self, data):
        """
        Backtest the strategy
        
        Args:
            data: DataFrame with OHLCV data
            
        Returns:
            portfolio: DataFrame with portfolio performance
        """
        signals = self.generate_signals(data)
        
        # Calculate portfolio performance
        portfolio = pd.DataFrame(index=signals.index)
        portfolio['holdings'] = (signals['positions'].cumsum() * signals['price'])
        portfolio['cash'] = self.initial_capital - (signals['positions'] * signals['price']).cumsum()
        portfolio['total'] = portfolio['cash'] + portfolio['holdings']
        portfolio['returns'] = portfolio['total'].pct_change()
        
        return portfolio

# Strategy configuration
STRATEGY_CONFIG = {
    'name': 'Moving Average Crossover',
    'short_window': 40,
    'long_window': 100,
    'initial_capital': 100000,
    'commission': 0.001,  # 0.1%
    'slippage': 0.0005    # 0.05%
}

# Example usage
strategy = TradingStrategy(initial_capital=STRATEGY_CONFIG['initial_capital'])

# Note: Replace 'your_data' with actual OHLCV DataFrame
# results = strategy.backtest(your_data)
# print(f"Total Return: {((results['total'].iloc[-1] / results['total'].iloc[0]) - 1) * 100:.2f}%")
`;

export default function AdvancedCodeEditor({
  defaultLanguage = "python",
  defaultValue = DEFAULT_PYTHON_CODE,
  onChange,
  onRun,
  height,
  className,
  showToolbar = true,
}: CodeEditorProps) {
  const [code, setCode] = useState(defaultValue);
  const [language, setLanguage] = useState(defaultLanguage);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordWrap] = useState(true);
  const [minimap] = useState(true);

  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const handleEditorChange = (value: string | undefined) => {
    const newValue = value || "";
    setCode(newValue);
    onChange?.(newValue, language);
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage as any);
    onChange?.(code, newLanguage);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy code");
    }
  };

  const handleDownload = () => {
    const langOption = LANGUAGE_OPTIONS.find((l) => l.value === language);
    const extension = langOption?.extension || ".txt";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `strategy${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Strategy downloaded!");
  };

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".py,.cpp,.txt,.h";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setCode(content);
          onChange?.(content, language);
          toast.success("File uploaded successfully!");
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleReset = () => {
    setCode(defaultValue);
    onChange?.(defaultValue, language);
    toast.success("Code reset to default");
  };

  const handleRun = () => {
    onRun?.(code, language);
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    editor.focus();

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRun();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      toast.success("Auto-save triggered");
    });

    // Enhanced editor options
    editor.updateOptions({
      wordBasedSuggestions: "allDocuments",
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true,
      },
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnCommitCharacter: true,
      acceptSuggestionOnEnter: "on",
      tabCompletion: "on",
      parameterHints: { enabled: true },
      suggestSelection: "first",
      wordWrap: wordWrap ? "on" : "off",
    });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Card
      ref={containerRef}
      className={cn(
        "w-full h-full flex flex-col",
        isFullscreen && "fixed inset-0 z-50 rounded-none",
        className
      )}
    >
      {showToolbar && (
        <CardHeader ref={headerRef} className="pb-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Code className="h-5 w-5" />
              Strategy Code Editor
            </CardTitle>

            <div className="flex flex-wrap items-center gap-2">
              {/* Language Selector */}
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      <div className="flex items-center gap-2">
                        <span>{lang.icon}</span>
                        {lang.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={handleUpload}>
                  <Upload className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        <div className="border-t flex-1">
          <Editor
            height={"100%"}
            language={language}
            value={code}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme={"light"}
            options={{
              fontSize: 16,
              fontFamily:
                "JetBrains Mono, Fira Code, Consolas, Monaco, monospace",
              lineNumbers: "on",
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              minimap: { enabled: minimap },

              // Enhanced autocomplete
              wordBasedSuggestions: "allDocuments",
              quickSuggestions: {
                other: true,
                comments: true,
                strings: true,
              },
              quickSuggestionsDelay: 50,
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnCommitCharacter: true,
              acceptSuggestionOnEnter: "on",
              tabCompletion: "on",
              wordWrap: wordWrap ? "on" : "off",

              // Code features
              folding: true,
              foldingHighlight: true,
              showFoldingControls: "always",
              matchBrackets: "always",
              autoClosingBrackets: "always",
              autoClosingQuotes: "always",
              autoIndent: "full",
              formatOnPaste: true,
              formatOnType: true,

              // Selection and cursor
              selectOnLineNumbers: true,
              cursorBlinking: "blink",
              cursorSmoothCaretAnimation: "on",
              multiCursorModifier: "ctrlCmd",

              // Scrolling
              smoothScrolling: true,
              mouseWheelZoom: true,

              // Advanced features
              codeLens: true,
              colorDecorators: true,
              contextmenu: true,
              dragAndDrop: true,
              find: {
                addExtraSpaceOnTop: false,
                autoFindInSelection: "never",
                seedSearchStringFromSelection: "always",
              },
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

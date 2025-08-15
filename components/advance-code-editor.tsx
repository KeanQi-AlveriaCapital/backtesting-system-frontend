// components/advance-code-editor.tsx
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
import {
  Copy,
  Download,
  RotateCcw,
  Code,
  Upload,
  Maximize2,
  Minimize2,
  Settings,
  Eye,
  EyeOff,
} from "lucide-react";
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
  { value: "javascript", label: "JavaScript", extension: ".js", icon: "🟨" },
  { value: "typescript", label: "TypeScript", extension: ".ts", icon: "🔷" },
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

const DEFAULT_CPP_CODE = `#include <iostream>
#include <vector>
#include <map>
#include <string>
#include <algorithm>
#include <cmath>

// Trading Strategy Implementation
class TradingStrategy {
private:
    double initial_capital;
    std::vector<std::map<std::string, double>> positions;
    
public:
    TradingStrategy(double capital = 100000.0) : initial_capital(capital) {}
    
    // Generate trading signals based on moving average crossover
    std::vector<int> generateSignals(const std::vector<double>& prices) {
        std::vector<int> signals(prices.size(), 0);
        
        if (prices.size() < 100) return signals;
        
        int short_window = 40;
        int long_window = 100;
        
        // Calculate moving averages
        std::vector<double> short_ma(prices.size(), 0.0);
        std::vector<double> long_ma(prices.size(), 0.0);
        
        // Short MA
        for (size_t i = short_window - 1; i < prices.size(); ++i) {
            double sum = 0.0;
            for (int j = 0; j < short_window; ++j) {
                sum += prices[i - j];
            }
            short_ma[i] = sum / short_window;
        }
        
        // Long MA
        for (size_t i = long_window - 1; i < prices.size(); ++i) {
            double sum = 0.0;
            for (int j = 0; j < long_window; ++j) {
                sum += prices[i - j];
            }
            long_ma[i] = sum / long_window;
        }
        
        // Generate signals
        for (size_t i = long_window; i < prices.size(); ++i) {
            if (short_ma[i] > long_ma[i] && short_ma[i-1] <= long_ma[i-1]) {
                signals[i] = 1;  // Buy signal
            } else if (short_ma[i] < long_ma[i] && short_ma[i-1] >= long_ma[i-1]) {
                signals[i] = -1; // Sell signal
            }
        }
        
        return signals;
    }
    
    // Backtest the strategy
    double backtest(const std::vector<double>& prices) {
        auto signals = generateSignals(prices);
        
        double cash = initial_capital;
        double shares = 0.0;
        double commission = 0.001; // 0.1%
        
        for (size_t i = 0; i < prices.size(); ++i) {
            if (signals[i] == 1 && cash > prices[i]) {
                // Buy
                double cost = prices[i] * (1 + commission);
                shares += cash / cost;
                cash = 0.0;
            } else if (signals[i] == -1 && shares > 0) {
                // Sell
                double proceeds = shares * prices[i] * (1 - commission);
                cash += proceeds;
                shares = 0.0;
            }
        }
        
        // Final portfolio value
        double final_value = cash + (shares * prices.back());
        return (final_value - initial_capital) / initial_capital * 100.0; // Return percentage
    }
    
    void printResults(double return_pct) {
        std::cout << "Strategy Results:" << std::endl;
        std::cout << "Initial Capital: $" << initial_capital << std::endl;
        std::cout << "Total Return: " << return_pct << "%" << std::endl;
    }
};

// Main function
int main() {
    TradingStrategy strategy(100000.0);
    
    // Example price data (replace with real data)
    std::vector<double> prices = {
        100.0, 101.5, 102.3, 101.8, 103.2, 104.1, 103.5, 105.2,
        106.8, 105.9, 107.3, 108.5, 107.2, 109.1, 110.3, 108.7
        // Add more price data here...
    };
    
    double return_pct = strategy.backtest(prices);
    strategy.printResults(return_pct);
    
    return 0;
}
`;

export default function AdvancedCodeEditor({
  defaultLanguage = "cpp",
  defaultValue,
  onChange,
  onRun,
  height = "600px",
  className,
  showToolbar = true,
}: CodeEditorProps) {
  // Determine initial code based on language and defaultValue
  const getInitialCode = () => {
    if (defaultValue) return defaultValue;
    return defaultLanguage === "python"
      ? DEFAULT_PYTHON_CODE
      : DEFAULT_CPP_CODE;
  };

  const [code, setCode] = useState(getInitialCode());
  const [language, setLanguage] = useState(defaultLanguage);
  const [isFullscreen] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [minimap, setMinimap] = useState(true);
  const [fontSize] = useState(16);
  const [theme] = useState<"light" | "dark">("light");

  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Update code when defaultValue changes (for editing existing strategies)
  useEffect(() => {
    if (defaultValue && defaultValue !== code) {
      setCode(defaultValue);
      onChange?.(defaultValue, language);
    }
  }, [defaultValue]);

  const handleEditorChange = (value: string | undefined) => {
    const newValue = value || "";
    setCode(newValue);
    onChange?.(newValue, language);
  };

  const handleLanguageChange = (newLanguage: string) => {
    const lang = newLanguage as typeof defaultLanguage;
    setLanguage(lang);

    // If no custom code and switching language, load default template
    if (
      !defaultValue &&
      (code === DEFAULT_PYTHON_CODE || code === DEFAULT_CPP_CODE || code === "")
    ) {
      const newCode =
        lang === "python" ? DEFAULT_PYTHON_CODE : DEFAULT_CPP_CODE;
      setCode(newCode);
      onChange?.(newCode, lang);
    } else {
      onChange?.(code, lang);
    }
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
    input.accept = ".py,.cpp,.txt,.h,.js,.ts";
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
    const defaultCode =
      language === "python" ? DEFAULT_PYTHON_CODE : DEFAULT_CPP_CODE;
    setCode(defaultCode);
    onChange?.(defaultCode, language);
    toast.success("Code reset to default template");
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

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
      handleDownload();
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
      fontSize: fontSize,
    });
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
              {defaultValue && (
                <span className="text-sm font-normal text-gray-500">
                  (Loaded from server)
                </span>
              )}
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

              {/* Settings */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWordWrap(!wordWrap)}
                  title="Toggle word wrap"
                >
                  <Eye className={`h-4 w-4 ${wordWrap ? "" : "opacity-50"}`} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMinimap(!minimap)}
                  title="Toggle minimap"
                >
                  <Settings
                    className={`h-4 w-4 ${minimap ? "" : "opacity-50"}`}
                  />
                </Button>
              </div>

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

              {/* Run Button */}
              {onRun && (
                <Button onClick={handleRun} size="sm">
                  ▶️ Run
                </Button>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Lines: {code.split("\n").length}</span>
            <span>Characters: {code.length}</span>
            <span>Language: {language.toUpperCase()}</span>
            <span>Font: {fontSize}px</span>
            {defaultValue && (
              <span className="text-blue-600 font-medium">
                📁 Loaded from file
              </span>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        <div
          className="border-t flex-1"
          style={{ height: isFullscreen ? "calc(100vh - 200px)" : height }}
        >
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme={theme === "dark" ? "vs-dark" : "light"}
            options={{
              fontSize: fontSize,
              fontFamily:
                "JetBrains Mono, Fira Code, Consolas, Monaco, monospace",
              lineNumbers: "on",
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              minimap: { enabled: minimap },
              wordWrap: wordWrap ? "on" : "off",

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

              // Performance
              renderLineHighlight: "all",
              renderValidationDecorations: "on",
              renderWhitespace: "selection",
              scrollbar: {
                vertical: "visible",
                horizontal: "visible",
                useShadows: false,
                verticalHasArrows: true,
                horizontalHasArrows: true,
              },
            }}
          />
        </div>
      </CardContent>

      {/* Footer with shortcuts */}
      {showToolbar && (
        <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>💡 Shortcuts:</span>
              <span>Ctrl+Enter: Run</span>
              <span>Ctrl+D: Download</span>
            </div>
            <div className="flex items-center gap-2">
              {language === "cpp" && <span>🛠️ C++ Mode</span>}
              {language === "python" && <span>🐍 Python Mode</span>}
              <span>Theme: {theme}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

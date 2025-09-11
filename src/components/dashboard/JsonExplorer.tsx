'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { exploreJSON, getValuePreview, suggestMappings, JsonPath } from '@/lib/jsonMapper';
import { WidgetMapping } from '@/store/slices/widgetsSlice';

interface JsonExplorerProps {
  data: unknown;
  onFieldSelect: (field: string, path: string) => void;
  currentMapping: WidgetMapping;
  widgetType: 'stock-table' | 'crypto-table' | 'custom-table';
}

const getWidgetFields = (widgetType: string) => {
  switch (widgetType) {
    case 'stock-table':
      return ['symbols', 'region'];
    case 'crypto-table':
      return ['symbol', 'price', 'change', 'changePercent', 'volume', 'lastUpdated'];
    case 'custom-table':
      return ['apiUrl'];
    default:
      return ['value'];
  }
};

export function JsonExplorer({ data, onFieldSelect, currentMapping, widgetType }: JsonExplorerProps) {
  const [expandedPaths, setExpandedPaths] = React.useState<Set<string>>(new Set());
  const [jsonPaths, setJsonPaths] = React.useState<JsonPath[]>([]);
  const [suggestions, setSuggestions] = React.useState<Record<string, string[]>>({});

  React.useEffect(() => {
    if (data) {
      const paths = exploreJSON(data, 4);
      setJsonPaths(paths);
      setSuggestions(suggestMappings(paths));
    }
  }, [data]);

  const togglePath = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const renderJsonPath = (jsonPath: JsonPath, depth: number = 0) => {
    const { path, value, type, isArray } = jsonPath;
    const isExpanded = expandedPaths.has(path);
    const isObject = type === 'object' || isArray;
    const isLeaf = !isObject;
    
    return (
      <div key={path} className="space-y-1">
        <div 
          className={`flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 ${
            depth > 0 ? 'ml-4' : ''
          }`}
        >
          {isObject && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={() => togglePath(path)}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">
                {path || 'root'}
              </code>
              <Badge variant="outline" className="text-xs">
                {isArray ? `array[${String(value).split('(')[1]?.split(')')[0] || ''}]` : type}
              </Badge>
              {isLeaf && (
                <span className="text-xs text-muted-foreground truncate">
                  {getValuePreview(value)}
                </span>
              )}
            </div>
          </div>
          
          {isLeaf && (
            <div className="flex items-center space-x-1">
              {getWidgetFields(widgetType).map(field => (
                <Button
                  key={field}
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => onFieldSelect(field, path)}
                  disabled={currentMapping[field] === path}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {field}
                </Button>
              ))}
            </div>
          )}
        </div>
        
        {isObject && isExpanded && (
          <div className="ml-2">
            {jsonPaths
              .filter(p => p.path.startsWith(path + '.') && p.path.split('.').length === path.split('.').length + 1)
              .map(childPath => renderJsonPath(childPath, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const applySuggestion = (field: string, suggestedPath: string) => {
    onFieldSelect(field, suggestedPath);
  };

  if (!data) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            No data to explore. Test an API URL first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Suggestions */}
      {Object.keys(suggestions).some(key => suggestions[key].length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Suggested Mappings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(suggestions).map(([field, paths]) => 
              paths.length > 0 && (
                <div key={field} className="flex items-center space-x-2">
                  <Badge>{field}</Badge>
                  <div className="flex flex-wrap gap-1">
                    {paths.slice(0, 3).map(path => (
                      <Button
                        key={path}
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => applySuggestion(field, path)}
                        disabled={currentMapping[field] === path}
                      >
                        {path}
                      </Button>
                    ))}
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* JSON Explorer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">JSON Structure</CardTitle>
        </CardHeader>
        <CardContent className="max-h-96 overflow-y-auto">
          <div className="space-y-1">
            {jsonPaths
              .filter(path => !path.path.includes('.') || path.path.split('.').length === 1)
              .map(jsonPath => renderJsonPath(jsonPath))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

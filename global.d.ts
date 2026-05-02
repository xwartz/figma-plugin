/// <reference path="./node_modules/@figma/plugin-typings/index.d.ts" />

type nameConventionType =
  | 'none'
  | 'PascalCase'
  | 'camelCase'
  | 'snake_case'
  | 'kebab-case'
  | 'UPPERCASE'
  | 'lowercase'
  | 'MACRO_CASE'
  | 'COBOL-CASE'
  | 'Cobol case'
  | 'Ada_Case'
  | 'dot.notation';

type colorModeType =
  | 'hex'
  | 'rgba-object'
  | 'rgba-css'
  | 'hsla-object'
  | 'hsla-css';

type stylesType = 'text' | 'colors' | 'effects' | 'grids';

type variableFeatureType = 'scope' | 'hidden';

type JSONSettingsStyleType = {
  isIncluded: boolean;
  customName: string;
};

interface IncludedStylesI {
  text: JSONSettingsStyleType;
  effects: JSONSettingsStyleType;
  grids: JSONSettingsStyleType;
  colors: JSONSettingsStyleType;
}

type GithubIssueKind = 'token' | 'primitive';

interface GithubIssueStateI {
  issueNumber?: string;
  fields: Record<string, string>;
}

interface GithubCredentialsI {
  isEnabled: boolean;
  token: string;
  repo: string;
  branch: string;
  fileName: string;
  owner: string;
  commitMessage?: string;
  templateFile?: string;
  preferredTemplateKind?: GithubIssueKind;
  handoffType?: GithubIssueKind;
  issueStateByKind: {
    token?: GithubIssueStateI;
    primitive?: GithubIssueStateI;
  };
}

interface ExportSettingsI {
  includedStyles: IncludedStylesI;
  includeScopes: boolean;
  useDTCGKeys: boolean;
  includeValueStringKeyToAlias: boolean;
  colorMode: colorModeType;
  storeStyleInCollection: string;
  includeFigmaMetaData: boolean;
  usePercentageOpacity: boolean;
  splitByCollection: boolean;
  omitCollectionNames: boolean;
}

interface ServerSettingsI {
  github: GithubCredentialsI;
}
type PluginStateI = {
  variableCollections: string[];
};

type JSONSettingsConfigI = ExportSettingsI &
  PluginStateI & {
    servers: ServerSettingsI;
  };

interface PluginTokenI {
  $value: string;
  $type: TokenType;
  $description: string;
  scopes?: VariableScope[];
  $extensions: {
    mode: Object;
    figma?: {
      variableId: string;
      codeSyntax: {
        WEB?: string;
        iOS?: string;
        ANDROID?: string;
      };
      collection: {
        id: string;
        name: string;
        defaultModeId: string;
      };
    };
  };
}

type ServerType = keyof ServerSettingsI;

type PluginMenuCommand =
  | 'export-design-token-json'
  | 'send-design-token-to-issue'
  | 'send-design-primitive-to-issue'
  | 'settings'
  | 'clear-cache'
  | 'help';

interface FigmaSelectionContextI {
  nodeId?: string;
  nodeName?: string;
  nodeType?: string;
  pageName?: string;
  selectedNodeCount: number;
}

interface TokensMessageI {
  type:
    | 'getTokens'
    | 'setTokens'
    | 'getFigmaContext'
    | 'setFigmaContext'
    | 'pluginCommand'
    | 'uiReady'
    | 'clearStorageConfig';
  tokens: any;
  role: 'preview' | 'push' | 'download';
  server: ServerType[];
  command?: PluginMenuCommand;
  figmaContext?: FigmaSelectionContextI;
}

interface MetaPropsI {
  useDTCGKeys: boolean;
  colorMode: colorModeType;
  variableCollections: string[] | undefined;
  createdAt: string;
}

interface ToastIPropsI {
  title: string;
  message: string;
  options: {
    type?: 'success' | 'error' | 'warn' | 'info';
    timeout?: number;
    onClose?: () => void;
  };
}

// Extend Figmas PaintStyle interface
interface PaintStyleExtended extends PaintStyle {
  readonly boundVariables?: {
    readonly paints: VariableAlias[];
  };
}

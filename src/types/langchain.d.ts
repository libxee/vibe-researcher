declare module '@langchain/community/tools' {
  export class DynamicTool {
    constructor(config: {
      name: string;
      description: string;
      func: (input: string) => Promise<string>;
    });
  }
}

declare module 'langchain/tools' {
  export type ToolDefinition = {
    name: string;
    description: string;
    func: (...args: any[]) => Promise<any>;
  };
} 
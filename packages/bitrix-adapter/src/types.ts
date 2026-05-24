export interface BitrixComponentFiles {
  componentPhp: string
  parametersPhp: string
  templatePhp: string
  styleCss: string
  scriptJs: string
}

export interface BitrixComponentDescriptor {
  namespace: string
  name: string
  title: string
  description?: string
  params?: Record<string, string>
  templateData?: Record<string, string>
  css?: string
  js?: string
  templatePhp?: string
  staticAssets?: Array<{ path: string; content: string | Buffer }>
}

export interface BitrixWriteOptions {
  rootDir: string
  namespace?: string
}

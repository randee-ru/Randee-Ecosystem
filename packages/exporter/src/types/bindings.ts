export interface IblockBinding {
  iblockId?: string
  sectionId?: string
  elementId?: string
}

export interface HighloadBinding {
  hlblockTable?: string
  fieldsMap?: Record<string, string>
}

export interface ExportBindingContext {
  iblock?: IblockBinding
  highload?: HighloadBinding
}

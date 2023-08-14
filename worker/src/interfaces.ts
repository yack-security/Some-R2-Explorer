export interface R2ExplorerConfig {
  readonly?: boolean
  cors?: boolean
  cfAccessTeamName?: string
  curlFeature?: boolean
  CF_ID?: any
  CF_SECRET?: any
}

export interface Context {
  config: R2ExplorerConfig
  userEmail?: string
}


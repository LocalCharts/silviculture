export type BuildSuccess = {
  success: true,
  content: string
}

export type BuildFailure = { 
  success: false,
  stdout: string,
  stderr: string
}

export type BuildResult = BuildSuccess | BuildFailure

export type PreviewRequest = {
  tree: string
}

export type BuildNotificationTag = 'building' | 'finished'

export type BuildState = 'unbuilt' | 'building' | 'built'

type Building = {
  state: 'building'
}

type Finished = {
  state: 'finished',
  result: BuildResult
}

export type BuildNotification = Building | Finished

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
export enum Level {
  log,
  error,
  warn
}

interface Entry {
  message: any
  logOnlyThis: boolean
  level: Level
}

type Options = Pick<Entry, 'logOnlyThis' | 'level'>

const entries: Entry[] = []

export const log = (message: any, options: Options = { logOnlyThis: false, level: Level.log }) => {
  entries.push({ message, ...options })
}

const logToConsole = (level: Level, message: any) => {
  switch (level) {
    default:
    case Level.log:
      console.log(message)
      break
    case Level.error:
      console.error(message)
      break
    case Level.warn:
      console.warn(message)
      break
  }
}

export const runLogger = (): void => {
  const onlyThisEntry = entries.find(({ logOnlyThis }) => !!logOnlyThis)
  if (onlyThisEntry) {
    return logToConsole(onlyThisEntry.level, onlyThisEntry.message)
  }

  entries.forEach(({ level, message }) => {
    logToConsole(level, message)
  })
}

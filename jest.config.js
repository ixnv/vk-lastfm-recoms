module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFilesAfterEnv: [
        '<rootDir>/config/setupEnzyme.ts',
    ],
    snapshotSerializers: ['enzyme-to-json/serializer'],
}
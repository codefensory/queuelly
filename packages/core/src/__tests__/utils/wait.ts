const wait = (delay: number) => new Promise(resolve => setTimeout(() => resolve(undefined), delay))

export default wait

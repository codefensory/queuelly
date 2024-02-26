import Counter from "./components/Counter"
import useLocalServer from "./providers/useLocalServer"

localStorage.debug = "*"

function App() {
  const localServer = useLocalServer()

  return (
    <>
      <div className="absolute top-0 z-[-2] h-screen w-screen bg-[#000000] bg-[radial-gradient(#ffffff33_1px,#00091d_1px)] bg-[size:20px_20px]"></div>
      <main className="relative m-auto max-w-screen-lg flex items-center flex-col">
        <span className="mt-12 bg-gradient-to-t from-[#c7d2fe] to-[#8678f9] bg-clip-text text-4xl text-transparent">
          Example
        </span>
        <span className="animate-text-gradient bg-gradient-to-r from-[#b2a8fd] via-[#8678f9] to-[#c7d2fe] bg-[200%_auto] bg-clip-text text-2xl text-transparent">
          Optimistic update counter
        </span>
        <p className="mt-4 text-white text-center">
          This counter uses an optimistic update along with a simulation of local server
          (with two seconds delay) to update its counter.
        </p>
        <p className="mt-2 text-white text-center">
          <span className="bg-gradient-to-r from-gray-100 via-[#c7d2fe] to-[#8678f9] text-gray-950 px-2">
            Blue buttons
          </span>{" "}
          decrease (-) or increment (+) the counter
        </p>
        <p className="mt-2 text-white text-center">
          <span className="bg-gradient-to-r from-gray-100 via-red-200 bg-[length:200%_200%] bg-[0%_0%] to-red-400 text-gray-950 px-2">
            Red buttons
          </span>{" "}
          decrease (-) or increment (+) the counter but server fail
        </p>
        <p className="mt-2 text-white text-center">Right input update the counter</p>
        <p className="mt-2 text-white text-center">
          Left input update the counter but server fail
        </p>
        <p className="mt-8 text-gray-400 text-center">
          Use console to view queuelly logs (enable Verbose level)
        </p>
        <div className="mt-12 w-full">
          <div className="relative h-48 w-full overflow-hidden rounded-xl border border-gray-800 p-[1px] backdrop-blur-3xl">
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
            <div className="inline-flex h-full w-full items-center justify-center rounded-xl bg-gray-950 px-3 py-1 text-sm font-medium text-gray-50 backdrop-blur-3xl">
              <Counter />
            </div>
          </div>
          <div className="mt-4 text-white text-center">
            <p>Server value: {localServer.serverValue}</p>
          </div>
        </div>
      </main>
    </>
  )
}

export default App

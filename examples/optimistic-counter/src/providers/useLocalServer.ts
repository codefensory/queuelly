import { useContext } from "react"
import { LocalServerContext } from "./LocalServerProvider"

const useLocalServer = () => useContext(LocalServerContext)

export default useLocalServer

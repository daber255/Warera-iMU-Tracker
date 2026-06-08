import { useState } from "react"
import "./tokenhandler.css"

export default function Tokenhandler({ setApiKey, onRefresh, onClose, dataHandler }) {
  const [localKey, setLocalKey] = useState(() => {
    try {
      return localStorage.getItem("warera_api_key") || ""
    } catch {
      return ""
    }
  })

  const [noKey, setNoKey] = useState(false)
  const [status, setStatus] = useState({ type: "", message: "" })

  const handleValidate = async (e) => {
    e.preventDefault()
    const cleanKey = localKey.trim()

    if (!cleanKey && !noKey) {
      setStatus({ type: "error", message: "Please enter an API token." })
      return
    }

    setStatus({ type: "loading", message: "Validating..." })

    try {
      localStorage.setItem("warera_api_key", cleanKey)
      dataHandler.updateClient()

      const testData = await dataHandler.loadAllMUs()
      console.log("API test result:", testData)

      setApiKey(cleanKey)
      setStatus({ type: "success", message: "OK" })

      if (onRefresh) onRefresh()

      setTimeout(() => {
        setStatus({ type: "", message: "" })
        if (onClose) onClose()
      }, 700)
    } catch (error) {
      console.error(error)
      localStorage.removeItem("warera_api_key")
      setStatus({ type: "error", message: "API token is invalid!" })
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2 className="modal-title">WarEra API Token</h2>
        <p className="modal-subtitle">Enter your API token to access WarEra data.</p>

        <form onSubmit={handleValidate} className="modal-form">
          <div className="input-group">
            <label className="input-label">API TOKEN</label>
            <input
              type="text"
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="Your WarEra API token..."
              className={`token-input ${status.type === "error" ? "input-error" : ""}`}
              disabled={status.type === "loading"}
            />
          </div>

          {status.message && (
            <div className={`status-message-box ${status.type}`}>
              <p className="status-text">{status.message}</p>
            </div>
          )}

          <div className="button-group">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={status.type === "loading"}
              onClick={() => setNoKey(false)}
            >
              {status.type === "loading" ? "Validating..." : "OK"}
            </button>

            <button
              type="submit"
              className="btn btn-secondary"
              disabled={status.type === "loading"}
              onClick={() => {
                setLocalKey("")
                setNoKey(true)
              }}
            >
              Continue without token
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

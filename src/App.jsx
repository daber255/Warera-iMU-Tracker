import { useState, useEffect, useMemo } from "react"
import "./index.css"
import Tokenhandler from "./components/tokenhandler.jsx"
import GroupedGrid from "./components/groupedgrid.jsx"
import MuDashboard from "./components/mudashboard.jsx"
import { DataHandler } from "./components/datahandler.js"
import adavLogo from "./assets/ADAV_logo.png"

function App() {
  const [apiKey, setApiKey] = useState(() => {
    try {
      return localStorage.getItem("warera_api_key") || ""
    } catch {
      return ""
    }
  })

  const dataHandler = useMemo(() => new DataHandler(), [])

  const [showTokenPopup, setShowTokenPopup] = useState(!apiKey)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMu, setSelectedMu] = useState(null)
  const [muData, setMuData] = useState([])
  const [hasCheckedInitialData, setHasCheckedInitialData] = useState(false)

  const handleLoadData = async (forceUpdate = false) => {
    setIsLoading(true)
    try {
      dataHandler.setForceUpdate(forceUpdate)
      const data = await dataHandler.loadAllMUs()
      setMuData(data)
    } catch (error) {
      console.error("Error loading MU data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!showTokenPopup && !hasCheckedInitialData && apiKey) {
    setHasCheckedInitialData(true)
    handleLoadData(false)
  }

  const closePopup = () => {
    setShowTokenPopup(false)
    handleLoadData(false)
  }

  useEffect(() => {
    if (selectedMu) {
      const currentId = selectedMu.id
      if (window.history.state?.muId !== currentId) {
        window.history.pushState({ view: "dashboard", muId: currentId }, "")
      }
    }

    const handlePopState = (event) => {
      const state = event.state
      if (state && state.view === "dashboard" && state.muId) {
        const match = muData.find((e) => e.id === state.muId)
        setSelectedMu(match || null)
      } else {
        setSelectedMu(null)
      }
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [selectedMu, muData])

  const handleBackToGrid = () => {
    if (window.history.state?.view === "dashboard") {
      window.history.back()
    } else {
      setSelectedMu(null)
    }
  }

  return (
    <>
      {showTokenPopup && (
        <Tokenhandler
          setApiKey={setApiKey}
          onRefresh={() => handleLoadData(true)}
          onClose={closePopup}
          dataHandler={dataHandler}
        />
      )}

      <div className="page-container">
        <div className="page-header">
          <div className="page-header-text">
            <img src={adavLogo} alt="ADAV" className="page-logo" />
            <h1>ADAV iMU Tracker</h1>
          </div>

          <div className="page-actions">
            <button
              className="btn-header btn-header-keychange"
              onClick={() => setShowTokenPopup(true)}
            >
              Change API Token
            </button>

            <button
              className="btn-header btn-header-refresh"
              disabled={isLoading}
              onClick={() => handleLoadData(true)}
            >
              {isLoading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      <hr className="color-border" />

      {selectedMu ? (
        <div className="dashboard-view-container">
          <button
            className="btn-secondary"
            style={{ marginBottom: "20px" }}
            onClick={handleBackToGrid}
          >
            ← Back to Overview
          </button>

          <MuDashboard selectedMu={selectedMu} dataHandler={dataHandler} />
        </div>
      ) : (
        isLoading && muData.length === 0 ? (
          <div className="grid-loading">Loading military units...</div>
        ) : (
          <GroupedGrid muData={muData} onSelectMu={setSelectedMu} />
        )
      )}
    </>
  )
}

export default App

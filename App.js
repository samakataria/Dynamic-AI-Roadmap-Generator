import React, { useState } from 'react';
import './App.css';
import ChatBot from "./chatbot";

function Roadmap() {
  const [project_name, set_project_name] = useState('');
  const [capacity, setcapacity] = useState('');
  const [start_date, setstart_date] = useState('');
  const [end_date, setend_date] = useState('');
  const [resources, setresources] = useState('');
  const [tasks, settasks] = useState([{ name: '', dependency: '', risks: '', milestones: '' }]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [roadmapText, setRoadmapText] = useState("");

  const handleAddTask = () => {
    settasks([...tasks, { name: '', dependency: '', risks: '', milestones: '' }]);
  };

  const handleTaskChange = (index, field, value) => {
    const updatedTasks = [...tasks];
    updatedTasks[index][field] = value;
    settasks(updatedTasks);
  };

  const handleFetchData = async () => {
    if (!project_name || !capacity || !start_date || !end_date || !resources || tasks.some(task => !task.name)) {
      setError('All required fields must be filled.');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    const postData = { project_name, start_date, end_date, capacity, resources, tasks };

    try {
      const response = await fetch("http://localhost:5000/roadmap-generator", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });

      if (!response.ok) throw new Error('Failed to fetch roadmap');
      const result = await response.json();
      setData(result.roadmap);

      const text = result.roadmap?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      setRoadmapText(text);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoadmap = async () => {
    try {
      const response = await fetch("http://localhost:5000/save-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name,
          start_date,
          end_date,
          capacity,
          resources,
          roadmapText
        })
      });

      const result = await response.json();
      alert(result.message);
    } catch (error) {
      alert("Failed to save roadmap");
      console.error(error);
    }
    


  
}
  const downloadRoadmap = async () => {
  if (!roadmapText) return alert("No roadmap to download");

  try {
    const response = await fetch("http://localhost:5000/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roadmapText, project_name })
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${project_name || "roadmap"}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download failed:", error);
  }
};


  return (
    <div className="App">
      <h1>AI-Powered Roadmap Generator</h1>

      <div className="form-container">
        <label>
          Project Name:
          <input type="text" value={project_name} onChange={e => set_project_name(e.target.value)} />
        </label>
        <label>
          Capacity:
          <input className='Capacity' type="number" value={capacity} onChange={e => setcapacity(e.target.value)} />
        </label>
        <label>
          Start Date:
          <input type="date" value={start_date} onChange={e => setstart_date(e.target.value)} />
        </label>
        <label>
          End Date:
          <input type="date" value={end_date} onChange={e => setend_date(e.target.value)} />
        </label>
        <label>
          Resources:
          <input type="text" value={resources} onChange={e => setresources(e.target.value)} />
        </label>

        <h3>Tasks</h3>
        {tasks.map((task, index) => (
          <div key={index} className="task-form">
            <label>
              Task Name:
              <input type="text" value={task.name} onChange={e => handleTaskChange(index, 'name', e.target.value)} />
            </label>
            <label>
              Dependency:
              <input type="text" value={task.dependency} onChange={e => handleTaskChange(index, 'dependency', e.target.value)} />
            </label>
            <label>
              Risks:
              <input className="risk"type="text" value={task.risks} onChange={e => handleTaskChange(index, 'risks', e.target.value)} />
            </label>
            <label>
              Milestones:
              <input type="text" value={task.milestones} onChange={e => handleTaskChange(index, 'milestones', e.target.value)} />
            </label>
          </div>
        ))}

        <button type="button" onClick={handleAddTask}>Add Task</button>
        <button type="button" onClick={handleFetchData}>Generate Roadmap</button>
        <button className="chatbot-open-btn" onClick={() => setShowChatbot(true)}>Open Chatbot</button>

        {data && (
          <><button className="save-btn" onClick={handleSaveRoadmap}>Save Roadmap to Database</button>
          <button onClick={downloadRoadmap}>Download Roadmap</button></>

        )}
   
      </div>

      {loading && <p className="loading-text">Generating roadmap...</p>}
      {error && <p className="error-text">{error}</p>}

      {data && (
        <div className="data-container">
          <h2>Generated Roadmap:</h2>
          <ul className="roadmap-list">
            {data.candidates?.map(candidate => {
              const tasksText = candidate?.content?.parts?.[0]?.text;
              if (!tasksText || typeof tasksText !== "string") return null;

              const tasksArray = tasksText
                .split("\n")
                .map(task => task.trim())
                .filter(task => task.length > 0)
                .filter(task => {
                  const firstChar = task[0];
                  return firstChar !== "*" && firstChar !== "#" && firstChar !== "•" && firstChar !== "∙" && firstChar !== "·";
                });

              return tasksArray.map((task, index) => (
                <li key={index} className="roadmap-item">{task}</li>
              ));
            })}
          </ul>
        </div>
      )}

      {showChatbot && (
        <div className="chatbot-overlay">
          <ChatBot />
          <button className="close-btn" onClick={() => setShowChatbot(false)}>Close</button>
        </div>
      )}
    </div>
  );
}

export default Roadmap;

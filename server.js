import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { MongoClient } from "mongodb";
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.API_KEY;
const MONGO_URI = process.env.MONGO_URI;
const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors({
    origin: "http://localhost:3000" // Allow frontend at port 3000
}));

// MongoDB setup

const client = new MongoClient(process.env.MONGO_URI);
let db;

client.connect()
    .then(() => {
        db = client.db("projectManagement");
        console.log("Connected to MongoDB");
    })
    .catch(err => console.error("MongoDB connection error:", err));

// -------------------
// Roadmap Generator Route
// -------------------
app.post('/roadmap-generator', async (req, res) => {
    const { project_name, start_date, end_date, capacity, resources, tasks = [] } = req.body;

    const prompt_text = `Generate a detailed project roadmap using the input data. 
output rules
- dont use tables
- dont use markdown tables
- dont use json or lists inside tables
- dont add extra headings
- use only exact text format shown in example below
- use plain text with line breaks
- each section must start exactly as example 
- use the input data as input for creating roadmap
for example(capacity-10 is total capacity for project,
same way start date and end date is for whole project that is total duration in which project is to be completed),
 
if capacity is less, generate roadmap only for frontend, backend and database.Also specify capacity or time is less can't include all phases)
 
focus on "input data" then generate the roadmap ,in input data resources field is equal to number of employees assigned in particular phase, 
if it is mentioned you cannot change ,if any input data field is mentioned you cannot change it"(REQUIRED CONDITION)
"Stick to the total capacity you cannot exceed it but you have to include all the employees and same with number of days you cannot exceed"(REQUIRED CONDITION)
"If employees names are mentioned you need to use it all over the roadmap wherever you assign employees (Required condition)
if project gets completed before time then mention it"(REQUIRED CONDITION)

example (Required format copy exactly):
Smart Inventory Management System — Project Roadmap
Project Details

Project Name: Smart Inventory Management System

Start Date: 01 March 2026

End Date: 30 June 2026

Total Team Capacity: 6 employees

This roadmap explains how the Smart Inventory Management System will be designed, developed, tested, and deployed within the given timeline and team capacity.

Phase-wise Execution Plan
Phase 1: Requirement Analysis & Planning

Start Date: 01 March 2026

End Date: 14 March 2026

Employees Assigned: 2

Subtasks:

Understand inventory workflows (stock in/out, suppliers, alerts)

Identify user roles (admin, staff, manager)

Define system features and reports

Prepare requirement and project planning documents

Outcome:
Clear and approved requirements for the Smart Inventory Management System.

Phase 2: Frontend Development

Start Date: 15 March 2026

End Date: 15 April 2026

Employees Assigned: 3

Subtasks:

Design wireframes for dashboard, inventory list, reports

Create UI layouts and navigation structure

Develop responsive screens using frontend framework

Implement forms for adding/updating inventory

Integrate frontend with backend APIs

Ensure mobile and browser compatibility

Outcome:
User-friendly and responsive frontend for managing inventory.

Phase 3: Backend Development

Start Date: 25 March 2026

End Date: 25 April 2026

Employees Assigned: 3

Subtasks:

Design backend architecture

Develop APIs for inventory, users, and suppliers

Implement business logic (stock updates, alerts)

Add authentication and role-based access

Handle validations, logging, and error handling

Outcome:
Secure and scalable backend supporting all system operations.

Phase 4: Database Design & Implementation

Start Date: 25 March 2026

End Date: 10 April 2026

Employees Assigned: 2

Subtasks:

Design database schema (products, suppliers, transactions)

Create tables and relationships

Add indexing for performance

Implement data validation and backups

Outcome:
Reliable and optimized database for inventory data.

Phase 5: Integration & Testing

Start Date: 26 April 2026

End Date: 20 May 2026

Employees Assigned: 2

Subtasks:

Integrate frontend, backend, and database

Perform functional and integration testing

Fix bugs and performance issues

Conduct user acceptance testing (UAT)

Outcome:
Stable and fully tested Smart Inventory Management System.

Phase 6: Deployment & Maintenance

Start Date: 21 May 2026

End Date: 30 June 2026

Employees Assigned: 1–2

Subtasks:

Deploy system to production environment

Configure servers and environment settings

Monitor system performance

Fix post-deployment issues

Provide basic maintenance and support

Outcome:
Smart Inventory Management System live and operational.

Input data:
- project_name: ${project_name}
- start_date: ${start_date}
- end_date: ${end_date}
- capacity: ${capacity}
- resources: ${resources}
${tasks.map(t => `- ${t}`).join('\n')}
`;

    const requestData = {
        contents: [
            {
                parts: [{ text: prompt_text }]
            }
        ]
    };

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
            requestData,
            { headers: { 'Content-Type': 'application/json' } }
        );

        res.status(200).json({
            message: 'Roadmap successfully generated by Gemini AI.',
            roadmap: response.data
        });
    } catch (error) {
        console.error('Error fetching from Gemini API:', error.response?.data || error.message);
        res.status(500).json({
            message: 'Failed to generate roadmap from Gemini AI.',
            error: error.message
        });
    }
});

// -------------------
// Chatbot Route
// -------------------
app.post("/chatbot", async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ reply: "No message provided" });

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
            {
                contents: [
                    {
                        role: "user",
                        parts: [{ text: message }]
                    }
                ]
            },
            { headers: { "Content-Type": "application/json" } }
        );

        const botReply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        res.json({ reply: botReply });
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ reply: "Something went wrong." });
    }
});

// -------------------
// Save Roadmap Route
// -------------------
app.post("/save-roadmap", async (req, res) => {
    try {
        const { project_name, start_date, end_date, capacity, resources, roadmapText } = req.body;

        await db.collection("roadmaps").insertOne({
            project_name,
            start_date,
            end_date,
            capacity,
            resources,
            roadmapText,
            generatedBy: "Gemini AI",
            format: "plain-text",
            createdAt: new Date()
        });

        res.json({ message: "Roadmap saved successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to save roadmap" });
    }
});

// -------------------
// Download Roadmap Route
// -------------------
app.post("/download", (req, res) => {
    const { roadmapText, project_name } = req.body;
    if (!roadmapText) return res.status(400).send("No roadmap provided");

    const filename = project_name ? `${project_name}_roadmap.txt` : "roadmap.txt";
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(roadmapText);
});

// -------------------
// Start Server
// -------------------
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

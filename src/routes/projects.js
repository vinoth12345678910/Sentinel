const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getDb } = require('../db');
const { apiRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/projects', authMiddleware, apiRateLimiter, (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'Project name is required' });
    }
    const db = getDb();
    const existing = db.prepare('SELECT id FROM projects WHERE name = ?').get(name);
    if (existing) {
      return res.status(409).json({ message: 'Project already exists' });
    }
    const result = db.prepare('INSERT INTO projects (name, description) VALUES (?, ?)').run(name, description || null);
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/projects', authMiddleware, apiRateLimiter, (req, res) => {
  try {
    const db = getDb();
    const projects = db.prepare(`
      SELECT p.*, COUNT(a.id) as app_count
      FROM projects p
      LEFT JOIN app_configs a ON a.project_id = p.id
      GROUP BY p.id
      ORDER BY p.name
    `).all();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/projects/:id', authMiddleware, apiRateLimiter, (req, res) => {
  try {
    const db = getDb();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const apps = db.prepare('SELECT * FROM app_configs WHERE project_id = ?').all(req.params.id);
    project.apps = apps;
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/projects/:id', authMiddleware, apiRateLimiter, (req, res) => {
  try {
    const db = getDb();
    const { name, description } = req.body;
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    updates.updated_at = new Date().toISOString();
    const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE projects SET ${sets} WHERE id = ?`).run(...Object.values(updates), req.params.id);
    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/projects/:id', authMiddleware, apiRateLimiter, (req, res) => {
  try {
    const db = getDb();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    db.prepare('UPDATE app_configs SET project_id = NULL WHERE project_id = ?').run(req.params.id);
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

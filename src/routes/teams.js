const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const { getDb } = require('../db');
const auditLogService = require('../services/auditLogService');
const { apiRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/teams', authMiddleware, requireRole('admin'), apiRateLimiter, (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Team name is required' });
    const db = getDb();
    const existing = db.prepare('SELECT id FROM teams WHERE name = ?').get(name);
    if (existing) return res.status(409).json({ message: 'Team already exists' });
    const result = db.prepare('INSERT INTO teams (name, description) VALUES (?, ?)').run(name, description || null);
    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(result.lastInsertRowid);
    auditLogService.log(req.user, 'team.create', 'team', team.id, { name });
    res.status(201).json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/teams', authMiddleware, apiRateLimiter, (req, res) => {
  try {
    const db = getDb();
    const teams = db.prepare(`
      SELECT t.*, COUNT(tm.id) as member_count
      FROM teams t
      LEFT JOIN team_members tm ON tm.team_id = t.id
      GROUP BY t.id
      ORDER BY t.name
    `).all();
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/teams/:id', authMiddleware, apiRateLimiter, (req, res) => {
  try {
    const db = getDb();
    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    team.members = db.prepare(`
      SELECT u.id, u.username, u.email, u.role, tm.role as team_role
      FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.team_id = ?
    `).all(req.params.id);

    team.projects = db.prepare(`
      SELECT p.* FROM team_projects tp
      JOIN projects p ON p.id = tp.project_id
      WHERE tp.team_id = ?
    `).all(req.params.id);

    res.json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/teams/:id', authMiddleware, requireRole('admin'), apiRateLimiter, (req, res) => {
  try {
    const db = getDb();
    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    const { name, description } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (Object.keys(updates).length === 0) return res.json(team);
    updates.updated_at = new Date().toISOString();
    const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE teams SET ${sets} WHERE id = ?`).run(...Object.values(updates), req.params.id);
    const updated = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
    auditLogService.log(req.user, 'team.update', 'team', team.id, { updates });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/teams/:id', authMiddleware, requireRole('admin'), apiRateLimiter, (req, res) => {
  try {
    const db = getDb();
    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    db.prepare('DELETE FROM teams WHERE id = ?').run(req.params.id);
    auditLogService.log(req.user, 'team.delete', 'team', team.id, { name: team.name });
    res.json({ message: 'Team deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/teams/:id/members', authMiddleware, requireRole('admin'), apiRateLimiter, (req, res) => {
  try {
    const db = getDb();
    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    let { user_id, username, role } = req.body;
    if (!user_id && !username) return res.status(400).json({ message: 'user_id or username is required' });
    let user;
    if (user_id) {
      user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(user_id);
    } else {
      user = db.prepare('SELECT id, username FROM users WHERE username = ?').get(username);
      user_id = user ? user.id : null;
    }
    if (!user) return res.status(404).json({ message: 'User not found' });
    db.prepare('INSERT OR IGNORE INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)').run(req.params.id, user_id, role || 'member');
    auditLogService.log(req.user, 'team.add_member', 'team', team.id, { user_id, username: user.username });
    res.status(201).json({ message: 'Member added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/teams/:id/members/:userId', authMiddleware, requireRole('admin'), apiRateLimiter, (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM team_members WHERE team_id = ? AND user_id = ?').run(req.params.id, req.params.userId);
    auditLogService.log(req.user, 'team.remove_member', 'team', req.params.id, { user_id: req.params.userId });
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/teams/:id/projects', authMiddleware, requireRole('admin'), apiRateLimiter, (req, res) => {
  try {
    const db = getDb();
    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    const { project_id } = req.body;
    if (!project_id) return res.status(400).json({ message: 'project_id is required' });
    const project = db.prepare('SELECT id, name FROM projects WHERE id = ?').get(project_id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    db.prepare('INSERT OR IGNORE INTO team_projects (team_id, project_id) VALUES (?, ?)').run(req.params.id, project_id);
    auditLogService.log(req.user, 'team.add_project', 'team', team.id, { project_id, project_name: project.name });
    res.status(201).json({ message: 'Project added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/teams/:id/projects/:projectId', authMiddleware, requireRole('admin'), apiRateLimiter, (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM team_projects WHERE team_id = ? AND project_id = ?').run(req.params.id, req.params.projectId);
    auditLogService.log(req.user, 'team.remove_project', 'team', req.params.id, { project_id: req.params.projectId });
    res.json({ message: 'Project removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const express = require('express');
const issueService = require('../services/issueService');

const router = express.Router();
const priorities = ['Low', 'Medium', 'High'];
const statuses = ['Open', 'Resolved'];
const editableFields = ['title', 'description', 'priority', 'status'];

function validateIssue(input, partial = false) {
	if (!input || typeof input !== 'object' || Array.isArray(input)) {
		return { error: 'Request body must be a JSON object' };
	}

	const keys = Object.keys(input);
	if (keys.some((key) => !editableFields.includes(key))) {
		return { error: 'Request contains unsupported fields' };
	}
	if (partial && keys.length === 0) {
		return { error: 'Provide at least one field to update' };
	}

	const issue = {};
	if (!partial || Object.hasOwn(input, 'title')) {
		if (typeof input.title !== 'string' || !input.title.trim() || input.title.trim().length > 100) {
			return { error: 'Title must be a non-empty string of at most 100 characters' };
		}
		issue.title = input.title.trim();
	}
	if (!partial || Object.hasOwn(input, 'description')) {
		if (typeof input.description !== 'string' || !input.description.trim() || input.description.trim().length > 1000) {
			return { error: 'Description must be a non-empty string of at most 1000 characters' };
		}
		issue.description = input.description.trim();
	}
	if (!partial || Object.hasOwn(input, 'priority')) {
		const priority = input.priority === undefined && !partial ? 'Medium' : input.priority;
		if (!priorities.includes(priority)) {
			return { error: 'Priority must be Low, Medium, or High' };
		}
		issue.priority = priority;
	}
	if (Object.hasOwn(input, 'status')) {
		if (!statuses.includes(input.status)) {
			return { error: 'Status must be Open or Resolved' };
		}
		issue.status = input.status;
	}

	return { issue };
}

router.get('/', async (req, res, next) => {
	try {
		res.json(await issueService.readIssuesFromFile());
	} catch (error) {
		next(error);
	}
});

router.get('/:id', async (req, res, next) => {
	try {
		const issues = await issueService.readIssuesFromFile();
		const issue = issues.find((item) => item.id === req.params.id);
		if (!issue) return res.status(404).json({ error: 'Issue not found' });
		res.json(issue);
	} catch (error) {
		next(error);
	}
});

router.post('/', async (req, res, next) => {
	const validation = validateIssue(req.body);
	if (validation.error) return res.status(400).json({ error: validation.error });

	try {
		const issue = await issueService.createIssue(validation.issue);
		res.status(201).json(issue);
	} catch (error) {
		next(error);
	}
});

router.patch('/:id', async (req, res, next) => {
	const validation = validateIssue(req.body, true);
	if (validation.error) return res.status(400).json({ error: validation.error });

	try {
		const issue = await issueService.updateIssue(req.params.id, validation.issue);
		res.json(issue);
	} catch (error) {
		if (error.message === 'Issue not found') return res.status(404).json({ error: error.message });
		next(error);
	}
});

router.delete('/:id', async (req, res, next) => {
	try {
		const issue = await issueService.deleteIssue(req.params.id);
		if (!issue) return res.status(404).json({ error: 'Issue not found' });
		res.json({ deleted: true, issue });
	} catch (error) {
		next(error);
	}
});

module.exports = router;

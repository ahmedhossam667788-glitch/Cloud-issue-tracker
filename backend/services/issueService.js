const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');

const datafilePath = path.join(__dirname, '../data/issues.json');

async function readIssuesFromFile() {
    try {
        const data = await fs.readFile(datafilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

async function writeIssuesToFile(issues) {
    await fs.writeFile(datafilePath, JSON.stringify(issues, null, 2), 'utf-8');
}

async function createIssue(input) {
    const issues = await readIssuesFromFile();
    const newIssue = {
        id: randomUUID(),
        title: input.title,
        description: input.description,
        priority: input.priority,
        status: 'Open',
        createdAt: new Date().toISOString()
    };

    issues.push(newIssue);
    await writeIssuesToFile(issues);
    return newIssue;
}
async function updateIssue(id, updates) {
    const issues = await readIssuesFromFile();
    const issueIndex = issues.findIndex(issue => issue.id === id);

    if (issueIndex === -1) {
        throw new Error('Issue not found');
    }

    issues[issueIndex] = { ...issues[issueIndex], ...updates };
    await writeIssuesToFile(issues);
    return issues[issueIndex];
}

async function deleteIssue(id) {
    const issues = await readIssuesFromFile();
    const issueIndex = issues.findIndex(issue => issue.id === id);
    if (issueIndex === -1) return null;

    const [deletedIssue] = issues.splice(issueIndex, 1);
    await writeIssuesToFile(issues);
    return deletedIssue;
}

module.exports = {
    createIssue,
    readIssuesFromFile,
    writeIssuesToFile,
    updateIssue,
    deleteIssue
};
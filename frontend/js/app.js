const API_URL = 'http://localhost:3000/api/issues';

const issueForm = document.querySelector('#issue-form');
const titleInput = document.querySelector('#title');
const descriptionInput = document.querySelector('#description');
const priorityInput = document.querySelector('#priority');
const issuesList = document.querySelector('#issues-list');
const formMessage = document.querySelector('#form-message');
const searchInput = document.querySelector('#search-issues');
const statusFilter = document.querySelector('#status-filter');
const priorityFilter = document.querySelector('#priority-filter');
let issues = [];
let loadError = '';

async function request(path = '', options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(data?.error || `Request failed (${response.status})`);
    }
    return data;
}

function updateSummary() {
    document.querySelector('#total-count').textContent = issues.length;
    document.querySelector('#open-count').textContent = issues.filter((issue) => issue.status === 'Open').length;
    document.querySelector('#resolved-count').textContent = issues.filter((issue) => issue.status === 'Resolved').length;
}

function createIssueCard(issue) {
    const card = document.createElement('article');
    card.className = 'issue-card';

    const cardTop = document.createElement('div');
    cardTop.className = 'issue-card-top';
    const issueId = document.createElement('span');
    issueId.className = 'issue-id';
    issueId.textContent = issue.id;
    const status = document.createElement('span');
    status.className = `status-badge status-${issue.status.toLowerCase()}`;
    status.textContent = issue.status;
    cardTop.append(issueId, status);

    const heading = document.createElement('h3');
    heading.textContent = issue.title;
    const description = document.createElement('p');
    description.className = 'issue-description';
    description.textContent = issue.description;

    const cardFooter = document.createElement('div');
    cardFooter.className = 'issue-card-footer';
    const metadata = document.createElement('div');
    metadata.className = 'issue-metadata';
    const priority = document.createElement('span');
    priority.className = `priority-label priority-${issue.priority.toLowerCase()}`;
    priority.textContent = `${issue.priority} priority`;
    const created = document.createElement('time');
    const date = new Date(issue.createdAt);
    created.dateTime = issue.createdAt;
    created.textContent = Number.isNaN(date.getTime())
        ? 'Date unavailable'
        : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
    metadata.append(priority, created);

    const actions = document.createElement('div');
    actions.className = 'issue-actions';
    const statusButton = document.createElement('button');
    statusButton.type = 'button';
    statusButton.className = 'text-button';
    statusButton.textContent = issue.status === 'Open' ? 'Resolve' : 'Reopen';
    statusButton.setAttribute('aria-label', `${statusButton.textContent} ${issue.title}`);
    statusButton.addEventListener('click', () => toggleIssueStatus(issue));
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete-button';
    deleteButton.textContent = 'Delete';
    deleteButton.setAttribute('aria-label', `Delete ${issue.title}`);
    deleteButton.addEventListener('click', () => deleteIssue(issue));
    actions.append(statusButton, deleteButton);
    cardFooter.append(metadata, actions);
    card.append(cardTop, heading, description, cardFooter);
    return card;
}

function renderIssues() {
    const query = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;
    const selectedPriority = priorityFilter.value;
    const visibleIssues = issues
        .filter((issue) => selectedStatus === 'All' || issue.status === selectedStatus)
        .filter((issue) => selectedPriority === 'All' || issue.priority === selectedPriority)
        .filter((issue) => `${issue.title} ${issue.description} ${issue.id}`.toLowerCase().includes(query))
        .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));

    issuesList.replaceChildren();
    visibleIssues.forEach((issue) => issuesList.append(createIssueCard(issue)));
    document.querySelector('#visible-count').textContent = `${visibleIssues.length} shown`;
    updateSummary();

    if (visibleIssues.length === 0) {
        const emptyState = document.createElement('p');
        emptyState.className = 'empty-state';
        emptyState.textContent = loadError || (issues.length === 0
            ? 'No issues yet. Use the form to report the first one.'
            : 'No issues match these filters.');
        issuesList.append(emptyState);
    }
}

async function loadIssues() {
    try {
        issues = await request();
        loadError = '';
        formMessage.textContent = '';
    } catch (error) {
        loadError = 'Issues could not be loaded. Check that the backend is running.';
        formMessage.textContent = loadError;
    }
    renderIssues();
}

async function toggleIssueStatus(issue) {
    formMessage.textContent = '';
    try {
        const status = issue.status === 'Open' ? 'Resolved' : 'Open';
        const updatedIssue = await request(`/${encodeURIComponent(issue.id)}`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
        issues = issues.map((item) => item.id === updatedIssue.id ? updatedIssue : item);
        renderIssues();
    } catch (error) {
        formMessage.textContent = error.message;
    }
}

async function deleteIssue(issue) {
    formMessage.textContent = '';
    try {
        await request(`/${encodeURIComponent(issue.id)}`, { method: 'DELETE' });
        issues = issues.filter((item) => item.id !== issue.id);
        renderIssues();
    } catch (error) {
        formMessage.textContent = error.message;
    }
}

issueForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = issueForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    formMessage.textContent = '';

    try {
        const issue = await request('', {
            method: 'POST',
            body: JSON.stringify({
                title: titleInput.value.trim(),
                description: descriptionInput.value.trim(),
                priority: priorityInput.value
            })
        });
        issues.unshift(issue);
        issueForm.reset();
        priorityInput.value = 'Medium';
        formMessage.textContent = 'Issue created.';
        renderIssues();
        titleInput.focus();
    } catch (error) {
        formMessage.textContent = error.message;
    } finally {
        submitButton.disabled = false;
    }
});

searchInput.addEventListener('input', renderIssues);
statusFilter.addEventListener('change', renderIssues);
priorityFilter.addEventListener('change', renderIssues);

renderIssues();
loadIssues();

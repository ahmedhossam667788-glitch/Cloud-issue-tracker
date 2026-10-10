const express = require('express');
const cors = require('cors');
const issuesRouter = require('./routes/issues');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '20kb' }));

app.get('/health', (req, res) => {
	res.json({ status: 'ok' });
});

app.use('/api/issues', issuesRouter);

app.use((req, res) => {
	res.status(404).json({ error: 'Route not found' });
});

app.use((error, req, res, next) => {
	if (res.headersSent) return next(error);

	const status = error.status || 500;
	if (status >= 500) console.error(error);
	res.status(status).json({ error: status >= 500 ? 'Internal server error' : error.message });
});

const port = Number(process.env.PORT) || 3000;

if (require.main === module) {
	app.listen(port, () => {
		console.log(`Issue API listening on http://localhost:${port}`);
	});
}

module.exports = app;

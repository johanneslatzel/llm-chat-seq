import { createServer, type ServerResponse, type Server } from 'node:http';

export interface MockSeqServer {
    url: string;
    close(): Promise<void>;
}

const ROOT = {
    Product: 'Seq',
    Version: '1.0',
    InstanceName: 'mock',
    Links: {
        EventsResources: 'api/events/resources',
        SignalsResources: 'api/signals/resources',
        SqlQueriesResources: 'api/sqlqueries/resources',
        DataResources: 'api/data/resources'
    }
};

const GROUP_LINKS: Record<string, Record<string, string>> = {
    '/api/events/resources': {
        Items: 'api/events',
        InSignal: 'api/events/signal',
        Item: 'api/events/{id}',
        Stream: 'api/events/stream',
        Scan: 'api/events/scan'
    },
    '/api/signals/resources': {
        Items: 'api/signals',
        Item: 'api/signals/{id}',
        Template: 'api/signals/template'
    },
    '/api/sqlqueries/resources': {
        Items: 'api/sqlqueries',
        Item: 'api/sqlqueries/{id}',
        Template: 'api/sqlqueries/template'
    },
    '/api/data/resources': { Query: 'api/data' }
};

const EVENTS = [
    {
        Timestamp: '2026-01-01T00:00:00Z',
        Level: 'Information',
        RenderedMessage: 'hello from mock'
    },
    {
        Timestamp: '2026-01-01T00:00:01Z',
        Level: 'Error',
        RenderedMessage: 'boom',
        Properties: [{ Name: 'user', Value: 'alice' }]
    }
];

const SIGNALS = [
    {
        Title: 'Errors',
        Id: 'sig-errors',
        Description: 'All errors',
        Filters: [{ Filter: "@Level = 'Error'" }]
    },
    { Title: 'Shared', Id: 'sig-shared', Filters: [{ Filter: '@Level = "Information"' }] }
];

export async function startMockSeq(): Promise<MockSeqServer> {
    const server = createServer((req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const path = url.pathname;
        if (req.method === 'GET' && path === '/api') {
            return json(res, ROOT);
        }
        if (req.method === 'GET' && GROUP_LINKS[path] !== undefined) {
            return json(res, { Links: GROUP_LINKS[path] });
        }
        if (req.method === 'GET' && path === '/api/events') {
            const count = Number(url.searchParams.get('count') ?? 30);
            return json(res, EVENTS.slice(0, count));
        }
        if (req.method === 'GET' && path === '/api/signals') {
            if (
                url.searchParams.get('shared') !== 'true' &&
                url.searchParams.get('ownerId') === null
            ) {
                return json(
                    res,
                    { Error: 'Only shared or personal signals can be requested.' },
                    400
                );
            }
            return json(res, SIGNALS);
        }
        if (req.method === 'POST' && path === '/api/data') {
            const format = url.searchParams.get('format');
            const q = url.searchParams.get('q') ?? '';
            if (format === 'text/csv') {
                res.writeHead(200, { 'Content-Type': 'text/csv' });
                res.end('q,count\n' + q + ',2\n');
                return;
            }
            return json(res, { Columns: [{ Name: 'q' }, { Name: 'count' }], Rows: [[q, 2]] });
        }
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ Error: 'not found' }));
    });

    await listen(server);
    return {
        url: `http://127.0.0.1:${portOf(server)}`,
        close: () => closeServer(server)
    };
}

function json(res: ServerResponse, data: unknown, status = 200): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

function listen(server: Server): Promise<void> {
    return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });
}

function portOf(server: Server): number {
    const address = server.address();
    if (address === null || typeof address === 'string') {
        throw new Error('mock seq server failed to bind');
    }
    return address.port;
}

function closeServer(server: Server): Promise<void> {
    return new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
    });
}

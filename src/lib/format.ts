import { eventProperties, type SeqEvent, type SignalEntity } from '@johannes.latzel/seq-client';

const MAX_CSV_RESULT_CHARS = 20_000;

/** Render events as readable blocks: timestamp, level, event type, rendered message, ids, exception, and flattened properties. */
export function formatEvents(events: SeqEvent[]): string {
    if (events.length === 0) {
        return 'No events matched the filter.';
    }
    return events.map(formatEvent).join('\n\n');
}

/** Render a CSV query result, truncating to 20 000 characters with an ellipsis marker. */
export function formatQueryResult(csv: string): string {
    if (csv.trim() === '') {
        return 'The query returned no rows.';
    }
    if (csv.length > MAX_CSV_RESULT_CHARS) {
        return `${csv.slice(0, MAX_CSV_RESULT_CHARS)}\n...[truncated ${csv.length - MAX_CSV_RESULT_CHARS} characters]`;
    }
    return csv;
}

/** Render signals as readable blocks: title, id, description, and filter expressions. */
export function formatSignals(signals: SignalEntity[]): string {
    if (signals.length === 0) {
        return 'No signals found.';
    }
    return signals.map(formatSignal).join('\n\n');
}

/**
 * Parse a value as an ISO 8601 date, pushing an error message when invalid.
 *
 * @param value  - The value to parse.
 * @param name   - Field name used in error messages.
 * @param errors - Accumulated validation errors.
 * @returns The parsed date, or undefined when `value` is undefined or invalid.
 */
export function parseIsoDate(value: unknown, name: string, errors: string[]): Date | undefined {
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== 'string') {
        errors.push(`${name} must be an ISO 8601 date string`);
        return undefined;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        errors.push(`${name} must be a valid ISO 8601 date string`);
        return undefined;
    }
    return date;
}

function formatEvent(event: SeqEvent): string {
    const header = [event.Timestamp, event.Level, event.EventType]
        .filter((v) => v !== undefined)
        .join(' ');
    const properties = eventProperties(event);
    const detail: string[] = [];
    if (event.Id !== undefined) detail.push(`id=${event.Id}`);
    if (event.TraceId !== undefined) detail.push(`trace=${event.TraceId}`);
    if (event.SpanId !== undefined) detail.push(`span=${event.SpanId}`);
    if (event.Exception !== undefined) detail.push(`exception=${event.Exception}`);
    if (Object.keys(properties).length > 0) detail.push(`properties=${JSON.stringify(properties)}`);
    const sections = [header, event.RenderedMessage ?? '', ...detail].filter((s) => s !== '');
    return sections.join('\n');
}

function formatSignal(signal: SignalEntity): string {
    const lines = [signal.Title];
    if (signal.Id !== undefined) lines.push(`id=${signal.Id}`);
    if (signal.Description !== undefined && signal.Description !== '') {
        lines.push(`description=${signal.Description}`);
    }
    const filters = (signal.Filters ?? [])
        .map((f) => f.Filter ?? f.FilterNonStrict)
        .filter((f): f is string => f !== undefined);
    if (filters.length > 0) lines.push(`filters: ${filters.join(' OR ')}`);
    return lines.join('\n');
}

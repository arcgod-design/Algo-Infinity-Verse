import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { getSession, sendJson, readJsonBody } from '../utils/helpers.js';
import { initializeFirebase } from '../../firebase.js';

const DATA_DIR = path.join(process.cwd(), 'data');

export async function handleSubmitInterviewExperience(req, res) {
  const session = getSession(req);
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: 'Invalid JSON body.' });
  }

  const { company, role, difficulty, rating, title, content, topics, rounds, offerStatus } =
    payload;

  if (!company || !role || !difficulty || !rating || !title || !content) {
    return sendJson(res, 400, {
      error: 'Company, role, difficulty, rating, title, and content are required.',
    });
  }

  // `topics` is optional. When provided it must be an array of non-empty
  // strings; each entry is trimmed before being stored so that downstream
  // filtering and search behave consistently and so whitespace-only tags do
  // not pollute the topic index (Issue #2401).
  let normalizedTopics = [];
  if (topics !== undefined && topics !== null) {
    if (!Array.isArray(topics)) {
      return sendJson(res, 400, {
        error: '`topics` must be an array of strings when provided.',
      });
    }
    for (let i = 0; i < topics.length; i += 1) {
      const entry = topics[i];
      if (typeof entry !== 'string') {
        return sendJson(res, 400, {
          error: `topics[${i}] must be a string; received ${entry === null ? 'null' : typeof entry}.`,
        });
      }
      const trimmed = entry.trim();
      if (trimmed === '') {
        return sendJson(res, 400, {
          error: `topics[${i}] must be a non-empty string.`,
        });
      }
      normalizedTopics.push(trimmed);
    }
  }

  const experienceData = {
    id: crypto.randomUUID(),
    userId: session ? session.sub : null,
    userName: session ? session.name : null,
    company: company.trim(),
    role: role.trim(),
    difficulty,
    rating,
    title: title.trim(),
    content: content.trim(),
    topics: normalizedTopics,
    rounds: rounds || null,
    offerStatus: offerStatus || null,
    upvotes: 0,
    createdAt: new Date().toISOString(),
  };

  try {
    const db = initializeFirebase();
    if (db) {
      const docRef = await db.collection('interviewExperiences').add(experienceData);
      experienceData.id = docRef.id;
    } else {
      const filePath = path.join(DATA_DIR, 'interview-experiences.json');
      await fs.mkdir(DATA_DIR, { recursive: true });
      let list = [];
      try {
        const raw = await fs.readFile(filePath, 'utf8');
        list = JSON.parse(raw || '[]');
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
      list.push(experienceData);
      await fs.writeFile(filePath, JSON.stringify(list, null, 2) + '\n');
    }
    return sendJson(res, 201, { success: true, experience: experienceData });
  } catch (err) {
    console.error('Error saving interview experience:', err);
    return sendJson(res, 500, {
      error: 'Failed to save interview experience.',
    });
  }
}

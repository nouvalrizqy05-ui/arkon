/**
 * ARKON API Documentation — Swagger/OpenAPI 3.0
 * Phase 3: API Documentation (from PHASE-2-COMPLETION.md next steps)
 * 
 * Access at: /api/docs (development) or /api/docs (production, auth-gated)
 */

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'ARKON API',
    version: '3.0.0',
    description: `
## ARKON — AI-Integrated Computer Architecture Learning Ecosystem

Platform web edukasi berbasis IRT Rasch Model untuk mata kuliah Arsitektur & Organisasi Komputer.

### Authentication
Semua endpoint (kecuali /auth/*) membutuhkan **Bearer JWT token** di header:
\`Authorization: Bearer <token>\`

### Rate Limits
- Auth endpoints: 10 req/15 menit
- AI endpoints: 20 req/15 menit
- General: 100 req/15 menit
    `,
    contact: { name: 'ARKON Team', email: 'arkon@dev.id' },
    license: { name: 'Private — LIDM 2027', url: 'https://belmawa.kemdikbud.go.id' }
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Development' },
    { url: 'https://arkon-backend.onrender.com', description: 'Production (Render)' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          full_name: { type: 'string', example: 'Muhammad Nouval' },
          identifier_number: { type: 'string', example: '21416255201123' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['mahasiswa', 'dosen'] },
          coins: { type: 'integer', example: 1250 },
          theta: { type: 'number', format: 'float', example: 0.85 }
        }
      },
      Room: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          course_name: { type: 'string', example: 'Arsitektur & Organisasi Komputer' },
          room_code: { type: 'string', example: 'ITDP-4821' },
          dosen_id: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['active', 'archived'] },
          is_live: { type: 'boolean' }
        }
      },
      IrtTheta: {
        type: 'object',
        properties: {
          theta: { type: 'number', example: 0.85 },
          category: {
            type: 'object',
            properties: {
              category: { type: 'string', example: 'competent' },
              label: { type: 'string', example: 'Kompeten' },
              color: { type: 'string', example: '#10b981' }
            }
          },
          responses_count: { type: 'integer' }
        }
      },
      QuizQuestion: {
        type: 'object',
        required: ['question_text', 'options', 'correct_index', 'difficulty'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          question_text: { type: 'string', example: 'Apa kepanjangan dari CPU?' },
          options: {
            type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 4,
            example: ['Central Processing Unit', 'Core Power Unit', 'Computer Processing Unit', 'Central Program Unit']
          },
          correct_index: { type: 'integer', minimum: 0, maximum: 3, example: 0 },
          difficulty: { type: 'integer', minimum: 1, maximum: 3, example: 1 },
          topic: { type: 'string', example: 'CPU Architecture' },
          explanation: { type: 'string', example: 'CPU adalah unit pemrosesan utama komputer.' }
        }
      },
      NGainResult: {
        type: 'object',
        properties: {
          student_id: { type: 'string' },
          student_name: { type: 'string' },
          pre_score: { type: 'number' },
          post_score: { type: 'number' },
          gain: { type: 'number', description: 'N-Gain Hake (1999): (post-pre)/(100-pre)' },
          category: { type: 'string', enum: ['Tinggi', 'Sedang', 'Rendah', 'Penurunan'] }
        }
      },
      Error: {
        type: 'object',
        properties: { error: { type: 'string' } }
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    // ─── AUTH ──────────────────────────────────────────
    '/api/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register akun baru',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['full_name', 'identifier_number', 'email', 'password', 'role'],
                properties: {
                  full_name: { type: 'string', example: 'Muhammad Nouval' },
                  identifier_number: { type: 'string', example: '21416255201123' },
                  email: { type: 'string', example: 'mahasiswa@univ.ac.id' },
                  password: { type: 'string', minLength: 8, example: 'SecurePass123!' },
                  role: { type: 'string', enum: ['mahasiswa', 'dosen'] }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Registrasi berhasil. Email verifikasi dikirim.' },
          '400': { description: 'Validasi gagal', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '409': { description: 'Email sudah terdaftar' }
        }
      }
    },
    '/api/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login dan dapatkan JWT token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'mahasiswa@univ.ac.id' },
                  password: { type: 'string', example: 'SecurePass123!' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login berhasil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string', description: 'JWT access token (15 menit)' },
                    refreshToken: { type: 'string', description: 'Refresh token (7 hari)' },
                    user: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          '401': { description: 'Kredensial tidak valid' }
        }
      }
    },
    '/api/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Logout dan revoke refresh token',
        responses: {
          '200': { description: 'Logout berhasil, token direvokasi' }
        }
      }
    },
    // ─── ROOMS ─────────────────────────────────────────
    '/api/rooms': {
      post: {
        tags: ['Rooms'],
        summary: 'Buat room baru (Dosen)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['course_name'],
                properties: {
                  course_name: { type: 'string', example: 'Arsitektur & Organisasi Komputer' },
                  description: { type: 'string' },
                  room_type: { type: 'string', enum: ['classroom', 'personal', 'collaborative'], default: 'classroom' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Room berhasil dibuat', content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } },
          '403': { description: 'Hanya dosen yang bisa membuat classroom' }
        }
      }
    },
    '/api/rooms/join': {
      post: {
        tags: ['Rooms'],
        summary: 'Join room via kode (Mahasiswa)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['room_code'],
                properties: { room_code: { type: 'string', example: 'ITDP-4821' } }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Berhasil join room' },
          '404': { description: 'Room tidak ditemukan' },
          '409': { description: 'Sudah menjadi anggota room' }
        }
      }
    },
    // ─── IRT ───────────────────────────────────────────
    '/api/irt/update-theta': {
      post: {
        tags: ['IRT Adaptive Assessment'],
        summary: 'Update theta mahasiswa setelah quiz session',
        description: 'Menggunakan Newton-Raphson MLE (Rasch 1PL). Theta baru dihitung server-side.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['responses'],
                properties: {
                  room_id: { type: 'string', format: 'uuid' },
                  responses: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        correct: { type: 'boolean' },
                        difficulty: { type: 'integer', minimum: 1, maximum: 3 }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Theta updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/IrtTheta' } } } }
        }
      }
    },
    '/api/irt/bank/{roomId}': {
      get: {
        tags: ['IRT Adaptive Assessment', 'Quiz Bank'],
        summary: 'List soal di bank quiz room (Dosen)',
        parameters: [
          { name: 'roomId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 15, maximum: 50 } },
          { name: 'difficulty', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 3 } },
          { name: 'topic', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'Paginated list soal',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    questions: { type: 'array', items: { $ref: '#/components/schemas/QuizQuestion' } },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    totalPages: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['IRT Adaptive Assessment', 'Quiz Bank'],
        summary: 'Tambah soal ke bank quiz (Dosen)',
        parameters: [{ name: 'roomId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/QuizQuestion' } } }
        },
        responses: {
          '201': { description: 'Soal berhasil ditambahkan' },
          '400': { description: 'Validasi gagal' },
          '403': { description: 'Bukan dosen room ini' }
        }
      }
    },
    '/api/irt/bank/health': {
      get: {
        tags: ['IRT Adaptive Assessment', 'Quiz Bank'],
        summary: 'Cek kesehatan bank soal (FR-IRT-006)',
        description: 'Returns warning jika soal < 30 per difficulty level',
        responses: {
          '200': {
            description: 'Bank health status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    total_questions: { type: 'integer' },
                    is_sufficient: { type: 'boolean' },
                    warnings: { type: 'array', items: { type: 'object' } },
                    recommendation: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    // ─── ANALYTICS / N-GAIN ────────────────────────────
    '/api/analytics/n-gain/{roomId}': {
      get: {
        tags: ['Analytics & N-Gain'],
        summary: 'Hitung N-Gain kelas (Hake 1999)',
        parameters: [{ name: 'roomId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'N-Gain class analytics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    classAverage: { type: 'object', properties: { gain: { type: 'number' }, label: { type: 'string' } } },
                    distribution: { type: 'object', properties: { high: { type: 'integer' }, medium: { type: 'integer' }, low: { type: 'integer' } } },
                    students: { type: 'array', items: { $ref: '#/components/schemas/NGainResult' } }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/analytics/report/pdf/{roomId}': {
      get: {
        tags: ['Analytics & N-Gain'],
        summary: 'Download laporan PDF akademis',
        description: 'Menghasilkan PDF dengan cover page, tabel N-Gain, distribusi theta, dan catatan metodologi Hake (1999)',
        parameters: [{ name: 'roomId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'PDF file',
            content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } }
          }
        }
      }
    },
    // ─── LIVE QUIZ ─────────────────────────────────────
    '/api/live-quiz/create': {
      post: {
        tags: ['Live Quiz'],
        summary: 'Buat sesi live quiz (Dosen)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['room_id', 'title', 'questions'],
                properties: {
                  room_id: { type: 'string' },
                  title: { type: 'string', example: 'Quiz CPU Architecture' },
                  questions: { type: 'array', items: { $ref: '#/components/schemas/QuizQuestion' } }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Sesi berhasil dibuat' }
        }
      }
    },
    '/api/live-quiz/save-results': {
      post: {
        tags: ['Live Quiz'],
        summary: 'Simpan hasil + push ke analytics N-Gain (FR-LIVE-007)',
        description: 'Menyimpan skor akhir, memberi reward koin top 3, dan push skor ke tabel analytics untuk kalkulasi N-Gain.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['session_id'],
                properties: {
                  session_id: { type: 'string' },
                  room_id: { type: 'string', description: 'Required untuk N-Gain pipeline' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Results saved + analytics updated' }
        }
      }
    },
    // ─── HEALTH ────────────────────────────────────────
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Health check endpoint',
        security: [],
        responses: {
          '200': {
            description: 'System health status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    database: { type: 'object', properties: { status: { type: 'string' } } },
                    redis: { type: 'object', properties: { status: { type: 'string' } } },
                    gemini: { type: 'object', properties: { status: { type: 'string' } } },
                    sentry: { type: 'object', properties: { status: { type: 'string' } } }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  tags: [
    { name: 'Authentication', description: 'Register, login, logout, token refresh' },
    { name: 'Rooms', description: 'Manajemen kelas dan join room' },
    { name: 'IRT Adaptive Assessment', description: 'IRT Rasch theta estimation dan adaptive quiz' },
    { name: 'Quiz Bank', description: 'CRUD bank soal per room (F-015 Content Authoring)' },
    { name: 'Analytics & N-Gain', description: 'N-Gain Hake, heatmap, IRT analytics, PDF export' },
    { name: 'Live Quiz', description: 'Real-time kuis kelas via Socket.io' },
    { name: 'System', description: 'Health check dan system info' }
  ]
};

function setupSwagger(app) {
  let swaggerUi;
  try {
    swaggerUi = require('swagger-ui-express');
  } catch {
    console.warn('⚠️ [Swagger] swagger-ui-express not installed. Run: npm install swagger-ui-express');
    
    // Fallback: serve raw spec as JSON
    app.get('/api/docs', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.json(swaggerSpec);
    });
    app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));
    console.info('ℹ️ [Swagger] Serving raw spec at /api/docs (JSON only)');
    return;
  }

  // Auth-gate docs in production
  const docsMiddleware = process.env.NODE_ENV === 'production'
    ? [(req, res, next) => {
        const key = req.query.key || req.headers['x-docs-key'];
        if (key !== process.env.DOCS_API_KEY) {
          return res.status(403).json({ error: 'API docs require docs key in query: ?key=YOUR_DOCS_KEY' });
        }
        next();
      }]
    : [];

  app.use('/api/docs', ...docsMiddleware, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'ARKON API Docs',
    customCss: '.swagger-ui .topbar { background: #1a1a2e; } .swagger-ui .topbar-wrapper img { display: none; }',
    swaggerOptions: { persistAuthorization: true }
  }));

  app.get('/api/docs.json', ...docsMiddleware, (req, res) => res.json(swaggerSpec));

  console.log(`✅ [Swagger] API docs at /api/docs${process.env.NODE_ENV === 'production' ? ' (protected by DOCS_API_KEY)' : ''}`);
}

module.exports = { setupSwagger, swaggerSpec };

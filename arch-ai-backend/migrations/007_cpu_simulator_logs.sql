CREATE TABLE IF NOT EXISTS cpu_simulator_logs (
    id SERIAL PRIMARY KEY,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    program_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    cycle_count INTEGER NOT NULL DEFAULT 0,
    memory_dump JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cpu_simulator_logs_student_id ON cpu_simulator_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_cpu_simulator_logs_created_at ON cpu_simulator_logs(created_at DESC);

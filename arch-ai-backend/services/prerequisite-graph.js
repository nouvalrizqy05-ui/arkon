/**
 * ARKON Prerequisite Graph — TASK-ALP-001
 * 
 * Defines the dependency structure between AOK (Architecture & Organization
 * of Computer) topics for the Adaptive Learning Path engine.
 * 
 * Each topic has:
 * - id: unique identifier matching quiz bank topics
 * - name: display name (Bahasa Indonesia)
 * - prerequisites: topic IDs that must be mastered first
 * - thetaThreshold: minimum theta in prerequisite topic to unlock this topic
 * - description: brief topic description
 * - chapter: Stallings textbook chapter reference
 * 
 * Usage:
 *   const { getRecommendedTopics } = require('./prerequisite-graph');
 *   const recommendations = getRecommendedTopics(studentTopicThetas);
 */

const TOPIC_GRAPH = [
  {
    id: 'cpu_basics',
    name: 'Dasar-Dasar CPU',
    prerequisites: [],
    thetaThreshold: -1.0,
    description: 'Komponen dasar CPU: ALU, Control Unit, Register, Program Counter',
    chapter: 'Ch. 1-2'
  },
  {
    id: 'number_systems',
    name: 'Sistem Bilangan & Representasi Data',
    prerequisites: [],
    thetaThreshold: -1.0,
    description: 'Binary, hexadecimal, complement, floating-point representation',
    chapter: 'Ch. 9'
  },
  {
    id: 'instruction_set',
    name: 'Set Instruksi (ISA)',
    prerequisites: ['cpu_basics', 'number_systems'],
    thetaThreshold: -0.5,
    description: 'Format instruksi, mode pengalamatan, tipe operasi',
    chapter: 'Ch. 10-11'
  },
  {
    id: 'alu_operations',
    name: 'Operasi ALU',
    prerequisites: ['cpu_basics', 'number_systems'],
    thetaThreshold: -0.5,
    description: 'Aritmatika integer & floating-point, operasi logika',
    chapter: 'Ch. 9'
  },
  {
    id: 'assembly_basics',
    name: 'Pemrograman Assembly',
    prerequisites: ['instruction_set'],
    thetaThreshold: 0.0,
    description: 'Assembly language, register operations, basic programs',
    chapter: 'Ch. 10'
  },
  {
    id: 'memory_hierarchy',
    name: 'Hierarki Memori',
    prerequisites: ['cpu_basics'],
    thetaThreshold: -0.5,
    description: 'Register, cache, main memory, disk — prinsip lokalitas',
    chapter: 'Ch. 4'
  },
  {
    id: 'cache_memory',
    name: 'Cache Memory',
    prerequisites: ['memory_hierarchy'],
    thetaThreshold: 0.0,
    description: 'Direct mapped, set associative, fully associative, write policies',
    chapter: 'Ch. 4'
  },
  {
    id: 'virtual_memory',
    name: 'Memori Virtual',
    prerequisites: ['memory_hierarchy'],
    thetaThreshold: 0.0,
    description: 'Paging, segmentation, page table, TLB',
    chapter: 'Ch. 8'
  },
  {
    id: 'cpu_control',
    name: 'Control Unit',
    prerequisites: ['instruction_set'],
    thetaThreshold: 0.0,
    description: 'Hardwired vs microprogrammed control, micro-operations',
    chapter: 'Ch. 15-16'
  },
  {
    id: 'pipeline',
    name: 'Pipeline CPU',
    prerequisites: ['instruction_set', 'cpu_control'],
    thetaThreshold: 0.5,
    description: 'Instruction pipeline, hazards (data, control, structural), forwarding',
    chapter: 'Ch. 12'
  },
  {
    id: 'branch_prediction',
    name: 'Branch Prediction',
    prerequisites: ['pipeline'],
    thetaThreshold: 0.5,
    description: 'Static & dynamic prediction, branch target buffer, speculative execution',
    chapter: 'Ch. 12'
  },
  {
    id: 'risc_vs_cisc',
    name: 'RISC vs CISC',
    prerequisites: ['instruction_set', 'pipeline'],
    thetaThreshold: 0.5,
    description: 'Perbedaan arsitektur RISC dan CISC, contoh: ARM vs x86',
    chapter: 'Ch. 13'
  },
  {
    id: 'io_systems',
    name: 'Sistem I/O',
    prerequisites: ['cpu_basics', 'memory_hierarchy'],
    thetaThreshold: 0.0,
    description: 'I/O modules, programmed I/O, interrupt-driven, DMA',
    chapter: 'Ch. 7'
  },
  {
    id: 'bus_systems',
    name: 'Sistem Bus',
    prerequisites: ['cpu_basics', 'io_systems'],
    thetaThreshold: 0.0,
    description: 'Bus architecture, PCI, data/address/control bus, arbitration',
    chapter: 'Ch. 3'
  },
  {
    id: 'multiprocessor',
    name: 'Arsitektur Multiprosesor',
    prerequisites: ['pipeline', 'cache_memory', 'bus_systems'],
    thetaThreshold: 1.0,
    description: 'SMP, multicore, cache coherence, Flynn taxonomy',
    chapter: 'Ch. 17-18'
  }
];

/**
 * Get recommended topics for a student based on their per-topic theta values
 * @param {Object} topicThetas - Map of topicId -> theta value
 * @returns {Array} Ordered list of recommended topics to study next
 */
function getRecommendedTopics(topicThetas = {}) {
  const recommendations = [];

  for (const topic of TOPIC_GRAPH) {
    const currentTheta = topicThetas[topic.id] ?? null;
    
    // Skip if already mastered (theta > 1.0)
    if (currentTheta !== null && currentTheta > 1.0) continue;
    
    // Check prerequisites
    const prereqsMet = topic.prerequisites.every(prereqId => {
      const prereqTheta = topicThetas[prereqId] ?? -4;
      const prereqTopic = TOPIC_GRAPH.find(t => t.id === prereqId);
      return prereqTheta >= (prereqTopic?.thetaThreshold ?? -1.0);
    });

    if (prereqsMet) {
      // Calculate priority: lower theta = higher priority (more need)
      const effectiveTheta = currentTheta ?? -4;
      const gap = topic.thetaThreshold - effectiveTheta;
      
      recommendations.push({
        topic: topic.id,
        name: topic.name,
        description: topic.description,
        chapter: topic.chapter,
        currentTheta: effectiveTheta,
        targetTheta: topic.thetaThreshold,
        gap: Math.max(0, gap),
        status: currentTheta === null ? 'not_started' : (currentTheta >= 1.0 ? 'mastered' : 'in_progress'),
        reason: currentTheta === null
          ? `Belum dimulai — mulai dari sini untuk membangun fondasi ${topic.name}`
          : gap > 0
          ? `Perlu peningkatan +${gap.toFixed(1)} theta — latih lebih banyak soal ${topic.name}`
          : `Sudah cukup baik — lanjut ke topik berikutnya`
      });
    }
  }

  // Sort: not_started first, then by gap descending (biggest gaps first)
  return recommendations.sort((a, b) => {
    if (a.status === 'not_started' && b.status !== 'not_started') return -1;
    if (b.status === 'not_started' && a.status !== 'not_started') return 1;
    return b.gap - a.gap;
  });
}

/**
 * Get the complete topic graph for visualization
 */
function getTopicGraph() {
  return TOPIC_GRAPH.map(topic => ({
    ...topic,
    prerequisiteNames: topic.prerequisites.map(pid => {
      const p = TOPIC_GRAPH.find(t => t.id === pid);
      return p ? p.name : pid;
    })
  }));
}

module.exports = { TOPIC_GRAPH, getRecommendedTopics, getTopicGraph };

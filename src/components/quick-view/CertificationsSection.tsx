'use client';

import { motion } from 'framer-motion';
import { scaleIn, fadeInUp, staggerContainer, viewportConfig } from '@/lib/animations';
import SectionHeading from '@/components/quick-view/SectionHeading';

interface Certification {
  name: string;
  issuer: string;
  platform?: string;
  date?: string;
}

const CERT_GROUPS: { label: string; color: string; certs: Certification[] }[] = [
  {
    label: 'IBM — Data Science & Python',
    color: '#4D7CFF',
    certs: [
      { name: 'Professional Data Science', issuer: 'IBM', platform: 'Coursera' },
      { name: 'Machine Learning with Python', issuer: 'IBM', platform: 'Coursera' },
      { name: 'Python for Data Science, AI and Development', issuer: 'IBM', platform: 'Coursera', date: 'Sep 2022' },
      { name: 'What is Data Science?', issuer: 'IBM', platform: 'Coursera', date: 'Dec 2022' },
      { name: 'Data Science Methodology', issuer: 'IBM', platform: 'Coursera', date: 'Jun 2023' },
      { name: 'Data Analysis with Python', issuer: 'IBM', platform: 'Coursera', date: 'Jan 2023' },
      { name: 'Data Visualization with Python', issuer: 'IBM', platform: 'Coursera', date: 'Jul 2023' },
      { name: 'Tools for Data Science', issuer: 'IBM', platform: 'Coursera' },
      { name: 'Databases and SQL for Data Science with Python', issuer: 'IBM', platform: 'Coursera', date: 'Nov 2022' },
      { name: 'Python Projects for Data Science', issuer: 'IBM', platform: 'Coursera', date: 'Oct 2022' },
      { name: 'Introduction to Data Engineering', issuer: 'IBM', platform: 'Coursera', date: 'Dec 2022' },
      { name: 'Getting Started with Git and GitHub', issuer: 'IBM', platform: 'Coursera', date: 'Jan 2023' },
    ],
  },
  {
    label: 'Microsoft & Other Platforms',
    color: '#00E5FF',
    certs: [
      { name: 'MTA 98-381: Introduction to Programming using Python', issuer: 'Microsoft', date: 'Mar 2022' },
      { name: 'Learning C', issuer: 'LinkedIn', date: 'Feb 2023' },
      { name: 'Python (Programming Language)', issuer: 'LinkedIn' },
      { name: 'Basic Python', issuer: 'HackerRank', date: 'May 2022' },
    ],
  },
  {
    label: 'Hackathons',
    color: '#FF00E5',
    certs: [
      { name: 'Parul Lets Hack', issuer: 'United Latino Students Association', date: 'Jun 2023' },
      { name: 'HackSVIT — Hackathon', issuer: 'Devfolio' },
      { name: 'DUHacks Certificate', issuer: 'Certopus' },
    ],
  },
];

// Issuer badge icons
function IssuerIcon({ issuer }: { issuer: string }) {
  if (issuer === 'IBM' || issuer === 'Coursera') {
    return (
      <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
        <path
          d="M9 1.5L11.3 6.2L16.5 6.9L12.75 10.6L13.6 15.75L9 13.3L4.4 15.75L5.25 10.6L1.5 6.9L6.7 6.2L9 1.5Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (issuer === 'Microsoft') {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <rect x="1" y="1" width="6.5" height="6.5" />
        <rect x="8.5" y="1" width="6.5" height="6.5" />
        <rect x="1" y="8.5" width="6.5" height="6.5" />
        <rect x="8.5" y="8.5" width="6.5" height="6.5" />
      </svg>
    );
  }
  // Trophy for hackathons, generic badge for others
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 15a7 7 0 100-14 7 7 0 000 14z" />
      <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
    </svg>
  );
}

export default function CertificationsSection() {
  const totalCount = CERT_GROUPS.reduce((sum, g) => sum + g.certs.length, 0);

  return (
    <section id="certifications" className="scroll-mt-20">
      <SectionHeading
        title="Certifications"
        subtitle={`${totalCount} industry certifications across Data Science, Python, ML, and more.`}
        color="#FFD700"
      />

      <div className="space-y-10">
        {CERT_GROUPS.map((group) => (
          <motion.div
            key={group.label}
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            {/* Group label */}
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: group.color }}
              />
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-[0.1em]">
                {group.label}
              </h3>
              <span className="text-[10px] text-gray-600 font-[var(--font-mono)]">
                ({group.certs.length})
              </span>
            </div>

            {/* Certs grid */}
            <motion.div
              className="grid gap-2.5 sm:grid-cols-2"
              variants={staggerContainer(0.05)}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
            >
              {group.certs.map((cert) => (
                <motion.div
                  key={cert.name}
                  variants={scaleIn}
                  className="group flex items-center gap-3 bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3.5 hover:border-white/[0.1] hover:bg-white/[0.03] transition-all duration-300"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:rotate-[15deg]"
                    style={{
                      color: group.color,
                      backgroundColor: `${group.color}10`,
                      border: `1px solid ${group.color}15`,
                    }}
                  >
                    <IssuerIcon issuer={cert.issuer} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-white font-medium leading-tight truncate">
                      {cert.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-500">{cert.platform || cert.issuer}</span>
                      {cert.date && (
                        <>
                          <span className="text-[10px] text-gray-700">·</span>
                          <span className="text-[10px] text-gray-600 font-[var(--font-mono)]">{cert.date}</span>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

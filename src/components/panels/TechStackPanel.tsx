const GROUPS: { label: string; items: string[] }[] = [
  { label: 'Cloud & Infrastructure', items: ['AWS S3', 'EC2', 'Glue', 'Redshift', 'Kinesis', 'IAM', 'EMR', 'Docker', 'Terraform (learning)'] },
  { label: 'Data Engineering', items: ['Apache Kafka', 'Apache Spark', 'PySpark', 'Apache Airflow', 'ETL pipelines'] },
  { label: 'Languages', items: ['Python', 'SQL (PostgreSQL, MS-SQL, TSQL)', 'R'] },
  { label: 'Databases', items: ['PostgreSQL', 'MongoDB', 'MS-SQL'] },
  { label: 'Monitoring & Logging', items: ['Splunk', 'Humio'] },
  { label: 'Visualisation', items: ['Tableau', 'Power BI'] },
  { label: 'ML/AI', items: ['Scikit-learn', 'TensorFlow', 'NLP'] },
  { label: 'Dev Tools', items: ['Git', 'GitHub', 'VS Code'] },
  {
    label: 'Certifications',
    items: ['AWS Cloud Practitioner ✅', 'AWS Solutions Architect (In Progress)', 'Python PCEP ✅', 'Python PCAP ✅', 'FISD Level 1 ✅'],
  },
];

export function TechStackPanel() {
  return (
    <div className="flex flex-col gap-5">
      {GROUPS.map((group) => (
        <div key={group.label}>
          <h3 className="text-xs uppercase tracking-wider text-[#D4602A] font-medium mb-2">{group.label}</h3>
          <div className="flex flex-wrap gap-1.5">
            {group.items.map((item) => (
              <span key={item} className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-[#CCCCCC]">
                {item}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

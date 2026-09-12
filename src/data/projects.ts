export interface ProjectCaseStudy {
  id: string;
  title: string;
  problem: string;
  metricValue: string;
  metricLabel: string;
  stack: string[];
}

// TODO: replace every metric/title/problem line with a real, verifiable case study before go-live.
// These four are illustrative placeholders standing in for the shape of the Workshop district.
export const PROJECTS: ProjectCaseStudy[] = [
  {
    id: 'latency',
    title: 'Request path rebuild',
    problem: 'A hot API path was slow enough that customers noticed. Redesigned the read path around caching and async writes.',
    metricValue: '800ms → 120ms',
    metricLabel: 'p99 latency (placeholder)',
    stack: ['AWS Lambda', 'DynamoDB', 'CloudFront'],
  },
  {
    id: 'warehouse-cost',
    title: 'Warehouse cost cleanup',
    problem: 'Storage and compute costs had crept up with scale. Rebuilt partitioning and lifecycle rules from first principles.',
    metricValue: '−60%',
    metricLabel: 'warehouse cost (placeholder)',
    stack: ['Redshift', 'S3', 'Glue'],
  },
  {
    id: 'idle-compute',
    title: 'Autoscaling overhaul',
    problem: 'Fleets were provisioned for peak and idle most of the day. Replaced static sizing with demand-driven scaling.',
    metricValue: '−55%',
    metricLabel: 'idle compute (placeholder)',
    stack: ['Terraform', 'EC2', 'CloudWatch'],
  },
  {
    id: 'incident-detection',
    title: 'Incident detection pipeline',
    problem: 'Problems surfaced from customer complaints before they surfaced from monitoring. Built anomaly detection ahead of the complaints.',
    metricValue: '20min → 90sec',
    metricLabel: 'detection time (placeholder)',
    stack: ['Airflow', 'Kafka', 'PagerDuty'],
  },
];

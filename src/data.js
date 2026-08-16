const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Ethan', 'Fiona', 'George', 'Hannah', 'Ian', 'Julia', 'Kevin', 'Liam', 'Mia', 'Noah', 'Olivia', 'Paul', 'Quinn', 'Rachel', 'Sam', 'Tara'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson'];

const modules = ['Clinical Practice', 'Anatomy', 'Pharmacology', 'Ethics', 'Pediatrics', 'Gerontology'];
const departments = ['ICU', 'Emergency', 'Surgery', 'Outpatient', 'Maternity', 'Psychiatry'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomStudent(id) {
  const firstName = getRandomItem(firstNames);
  const lastName = getRandomItem(lastNames);
  const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
  const statuses = ['tag-active', 'tag-pending', 'tag-urgent'];
  const statusText = ['Active', 'Pending Review', 'Needs Attention'];
  
  const statusIndex = Math.floor(Math.random() * statuses.length);

  return {
    id: `NS-${String(id).padStart(4, '0')}`,
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@nursing-edu.org`,
    module: getRandomItem(modules),
    department: getRandomItem(departments),
    progress: Math.floor(Math.random() * 100),
    color: getRandomItem(colors),
    statusClass: statuses[statusIndex],
    statusText: statusText[statusIndex],
    initials: `${firstName.charAt(0)}${lastName.charAt(0)}`
  };
}

export const generateDummyData = (count = 24) => {
  return Array.from({ length: count }, (_, i) => generateRandomStudent(i + 1));
};

// Script to update floating labels in auth pages
const fs = require('fs');

// Update Login.tsx
let loginContent = fs.readFileSync('src/pages/AuthPage/Login.tsx', 'utf8');

// Update email label
loginContent = loginContent.replace(
  /fontSize: formData\.email \? '0\.75rem' : \(window\.innerWidth < 768 \? '0\.875rem' : '1rem'\)/g,
  "fontSize: (formData.email || focused === 'email') ? '0.75rem' : (window.innerWidth < 768 ? '0.875rem' : '1rem')"
);

loginContent = loginContent.replace(
  /color: formData\.email \? brandColors\.primary\[600\] : brandColors\.neutral\[500\]/g,
  "color: (formData.email || focused === 'email') ? brandColors.primary[600] : brandColors.neutral[500]"
);

loginContent = loginContent.replace(
  /padding: formData\.email \? '0 0\.5rem' : '0'/g,
  "padding: (formData.email || focused === 'email') ? '0 0.5rem' : '0'"
);

// Update password label
loginContent = loginContent.replace(
  /fontSize: formData\.password \? '0\.75rem' : \(window\.innerWidth < 768 \? '0\.875rem' : '1rem'\)/g,
  "fontSize: (formData.password || focused === 'password') ? '0.75rem' : (window.innerWidth < 768 ? '0.875rem' : '1rem')"
);

loginContent = loginContent.replace(
  /color: formData\.password \? brandColors\.primary\[600\] : brandColors\.neutral\[500\]/g,
  "color: (formData.password || focused === 'password') ? brandColors.primary[600] : brandColors.neutral[500]"
);

loginContent = loginContent.replace(
  /padding: formData\.password \? '0 0\.5rem' : '0'/g,
  "padding: (formData.password || focused === 'password') ? '0 0.5rem' : '0'"
);

// Add opacity to both labels
loginContent = loginContent.replace(
  /transition: 'all 0\.2s ease',\s*pointerEvents: 'none'/g,
  "transition: 'all 0.2s ease',\n                opacity: (formData.email || focused === 'email') ? 1 : 0.7,\n                pointerEvents: 'none'"
);

fs.writeFileSync('src/pages/AuthPage/Login.tsx', loginContent);

console.log('Updated Login.tsx floating labels');

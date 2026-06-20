// assets/js/template.js
// ===== SHARED TEMPLATE SYSTEM =====
// This script runs on ALL pages to load the saved template

const TEMPLATES = ['emerald', 'ocean', 'sunset', 'midnight', 'sakura'];

// Force shadow variables on body immediately
function forceShadowVars() {
  const style = getComputedStyle(document.body);
  const accentGlow = style.getPropertyValue('--accent-glow').trim();
  const accent = style.getPropertyValue('--accent').trim();
  
  if (accentGlow) {
    document.body.style.setProperty('--shadow-tab-active', `0 4px 15px ${accentGlow}`);
    document.body.style.setProperty('--shadow-selected', `0 0 18px ${accentGlow}`);
    document.body.style.setProperty('--shadow-btn-hover', `0 10px 25px ${accentGlow}`);
    document.body.style.setProperty('--shadow-save-btn', `0 4px 15px ${accentGlow}`);
    document.body.style.setProperty('--shadow-send-btn', `0 4px 10px ${accentGlow}`);
    document.body.style.setProperty('--shadow-card-hover', `0 15px 35px ${accentGlow}`);
    document.body.style.setProperty('--shadow-start-modal', `0 20px 50px rgba(0,0,0,0.45), 0 0 25px ${accentGlow}`);
    document.body.style.setProperty('--shadow-confirm-btn-hover', `0 10px 20px ${accentGlow}`);
  }
  if (accent) {
    document.body.style.setProperty('--shadow-send-btn-hover', `0 0 18px ${accent}`);
  }
}

// Apply template to body
function applyTemplate(templateName) {
  // Remove all template classes from body
  TEMPLATES.forEach(t => {
    document.body.classList.remove(`template-${t}`);
  });
  
  // Add the selected template class
  if (templateName && TEMPLATES.includes(templateName)) {
    document.body.classList.add(`template-${templateName}`);
  } else {
    document.body.classList.add('template-emerald');
  }

  // Force shadow variables immediately
  requestAnimationFrame(() => {
    forceShadowVars();
  });
}

// Load template from Firestore and apply it
async function loadTemplateGlobally() {
  try {
    // Wait for auth to be ready
    const user = await new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged(user => {
        unsubscribe();
        resolve(user);
      });
    });

    if (!user) {
      applyTemplate('emerald');
      return;
    }

    const doc = await db.collection('users').doc(user.uid).get();
    const data = doc.exists ? doc.data() : {};
    
    if (data.template) {
      applyTemplate(data.template);
    } else {
      applyTemplate('emerald');
    }
  } catch (err) {
    console.error('Failed to load template:', err);
    applyTemplate('emerald');
  }
}

// Run the template loader when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadTemplateGlobally);
} else {
  loadTemplateGlobally();
}
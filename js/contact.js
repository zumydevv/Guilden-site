/* A local brief composer. The visitor sends the final draft from their mail app. */
(function () {
  'use strict';
  function buildInquiry(data, email) {
    var kinds = { build: 'New Roblox game', redesign: 'Roblox visual redesign', question: 'General enquiry' };
    var kind = Object.prototype.hasOwnProperty.call(kinds, data.project) ? data.project : 'build';
    var subject = kinds[kind] + ' — Guilden';
    var lines = ['Project: ' + kinds[kind], 'Name / studio: ' + (data.name || 'Not specified')];
    if (kind === 'redesign') lines.push('Roblox game: ' + (data.gameUrl || 'To discuss'));
    lines.push('', 'Brief:', data.idea || '', '', 'Budget: ' + (data.budget || 'To discuss'), 'Timeline: ' + (data.timeline || 'Flexible'));
    var body = lines.join('\n');
    return { body: body, href: 'mailto:' + email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body) };
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = { buildInquiry: buildInquiry }; return; }
  var form = document.getElementById('project-form');
  if (!form) return;
  var kind = document.getElementById('project-kind');
  var game = document.getElementById('game-url');
  var idea = document.getElementById('project-idea');
  var requested = new URLSearchParams(window.location.search).get('project');
  if (['build', 'redesign', 'question'].indexOf(requested) !== -1) kind.value = requested;
  function updateKind() {
    var redesign = kind.value === 'redesign';
    document.getElementById('game-url-field').hidden = !redesign;
    game.disabled = !redesign;
    game.required = redesign;
    document.getElementById('idea-label').textContent = redesign ? 'What would you like to improve?' : kind.value === 'question' ? 'What would you like to discuss?' : 'Tell us about your idea';
    idea.placeholder = redesign ? 'The visual style, environments or interface you want to improve, and any references.' : 'The idea, the kind of experience, and what you’d like us to create.';
  }
  kind.addEventListener('change', updateKind);
  updateKind();
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!idea.value.trim()) { idea.setCustomValidity('Please add a few details about your project.'); idea.reportValidity(); return; }
    var data = Object.fromEntries(new FormData(form));
    var email = (window.GUILDEN_CONFIG && window.GUILDEN_CONFIG.contacts.email) || 'guilden.business@gmail.com';
    var draft = buildInquiry(data, email);
    document.getElementById('prepared-brief').value = draft.body;
    document.getElementById('inquiry-fallback').hidden = false;
    window.location.href = draft.href;
  });
  idea.addEventListener('input', function () { idea.setCustomValidity(''); });
})();

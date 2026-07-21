const toggle = document.querySelector('.user-toggle');
const dropdown = document.querySelector('.user-dropdown');



toggle.addEventListener('click', function(e) {
  e.preventDefault();
  dropdown.classList.toggle('active');
});
    
document.addEventListener('click', function(e) {
  if (!e.target.closest('.user-menu')) {
    dropdown.classList.remove('active');
  }
});
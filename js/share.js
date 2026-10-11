(function(){
 document.querySelectorAll('[data-share-url]').forEach(function(row){
  var url=row.getAttribute('data-share-url'),title=row.getAttribute('data-share-title');
  if(!url||!/^https:\/\/velluminstitute\.org\//.test(url))return;
  var copy=row.querySelector('[data-share-copy]'),native=row.querySelector('[data-share-native]'),status=row.querySelector('[role="status"]'),fallback=row.querySelector('.vellum-share-fallback'),input=fallback&&fallback.querySelector('input');
  function say(text){if(status)status.textContent=text;}
  function manual(){if(fallback)fallback.hidden=false;if(input){input.focus();input.select();}say('Select and copy the page link.');}
  async function copyLink(){if(fallback)fallback.hidden=true;var copied=false;
   try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(url);copied=true;}}catch(error){}
   if(!copied){var field=document.createElement('textarea');field.value=url;field.setAttribute('readonly','');field.style.position='fixed';field.style.top='-1000px';document.body.appendChild(field);field.select();try{copied=!!document.execCommand('copy');}catch(error){}field.remove();}
   if(copied){say('Link copied.');copy.focus();}else manual();
  }
  if(copy){copy.hidden=false;copy.addEventListener('click',copyLink);}
  if(native&&typeof navigator.share==='function'){native.hidden=false;native.addEventListener('click',async function(){try{await navigator.share({title:title,url:url});say('');}catch(error){if(error.name!=='AbortError')say('Use Copy link, Email or WhatsApp to share.');}});}
 });
})();

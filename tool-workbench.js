(function(){
  var root=document.querySelector('[data-tool-demo]');
  if(!root) return;
  var tool=root.getAttribute('data-tool-demo');
  var files={};
  var run=document.querySelector('[data-run]');
  var consent=document.querySelector('[data-consent]');
  var status=document.querySelector('[data-status]');
  var statusText=status?status.querySelector('[data-status-text]'):null;
  var progress=document.querySelector('[data-progress-wrap]');
  var progressBar=document.querySelector('[data-progress-bar]');
  var progressText=document.querySelector('[data-progress-text]');
  var empty=document.querySelector('[data-empty]');
  var compare=document.querySelector('[data-compare]');
  var imageGrid=document.querySelector('[data-image-grid]');
  var actions=document.querySelector('[data-result-actions]');
  var faceEnhance=document.querySelector('[data-face-enhance]');
  var removeWatermark=document.querySelector('[data-remove-watermark]');
  var extensionMeta=document.querySelector('[data-extension-meta]');

  function toast(msg){
    var el=document.querySelector('.toast');
    if(!el){el=document.createElement('div');el.className='toast';document.body.appendChild(el);}
    el.textContent=msg;el.classList.add('show');
    setTimeout(function(){el.classList.remove('show');},1800);
  }

  function fileLabel(file){
    var size=file.size>1048576?(file.size/1048576).toFixed(1)+' MB':Math.max(1,Math.round(file.size/1024))+' KB';
    return file.name+' · '+size;
  }

  function renderUpload(zone,file,key){
    var box=zone.querySelector('.upload-preview');
    if(files[key]&&files[key].url) URL.revokeObjectURL(files[key].url);
    var url=URL.createObjectURL(file);
    box.innerHTML='';
    var media=document.createElement(file.type.indexOf('video/')===0?'video':'img');
    media.src=url;
    if(media.tagName==='VIDEO'){media.muted=true;media.loop=true;media.playsInline=true;media.autoplay=true;}
    var overlay=document.createElement('div');overlay.className='file-overlay';
    var label=document.createElement('span');label.textContent=fileLabel(file);
    var remove=document.createElement('button');remove.type='button';remove.textContent='Replace';
    remove.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();zone.querySelector('input').click();});
    overlay.appendChild(label);overlay.appendChild(remove);box.appendChild(media);box.appendChild(overlay);
    zone.classList.add('has-file');files[key]={file:file,url:url};
  }

  function requiredReady(){
    var ok=true;
    document.querySelectorAll('[data-upload][data-required="true"]').forEach(function(zone){
      if(!files[zone.getAttribute('data-upload')]) ok=false;
    });
    document.querySelectorAll('[data-required-text]').forEach(function(field){
      if(!field.value.trim()) ok=false;
    });
    if(consent && !consent.checked) ok=false;
    if(run) run.disabled=!ok;
    updateApiLinks();
  }

  document.querySelectorAll('[data-upload]').forEach(function(zone){
    var input=zone.querySelector('input');
    var key=zone.getAttribute('data-upload');
    ['dragenter','dragover'].forEach(function(evt){zone.addEventListener(evt,function(e){e.preventDefault();zone.classList.add('drag');});});
    ['dragleave','drop'].forEach(function(evt){zone.addEventListener(evt,function(e){e.preventDefault();zone.classList.remove('drag');});});
    zone.addEventListener('drop',function(e){if(e.dataTransfer.files[0]){renderUpload(zone,e.dataTransfer.files[0],key);requiredReady();}});
    input.addEventListener('change',function(){if(input.files[0]){renderUpload(zone,input.files[0],key);requiredReady();}});
  });

  document.querySelectorAll('[data-choice-group]').forEach(function(group){
    group.addEventListener('click',function(e){
      var choice=e.target.closest('[data-choice]');if(!choice)return;
      group.querySelectorAll('[data-choice]').forEach(function(el){el.classList.remove('on');});
      choice.classList.add('on');updateApiLinks();
    });
  });
  document.querySelectorAll('select,textarea,input[type="text"]').forEach(function(el){el.addEventListener('input',function(){updateApiLinks();requiredReady();});});
  if(consent) consent.addEventListener('change',requiredReady);
  if(faceEnhance) faceEnhance.addEventListener('change',updateApiLinks);
  if(removeWatermark) removeWatermark.addEventListener('change',function(){
    updateApiLinks();
    var watermark=document.querySelector('[data-demo-watermark]');
    if(watermark) watermark.style.display=removeWatermark.checked?'none':'block';
  });

  function chosen(name,fallback){
    var el=document.querySelector('[data-choice-group="'+name+'"] .on');
    return el?el.getAttribute('data-choice'):fallback;
  }
  function inputValue(sel,fallback){var el=document.querySelector(sel);return el&&el.value?el.value:fallback;}
  function updateApiLinks(){
    var query=new URLSearchParams();
    if(tool==='upscaler'){
      query.set('workflow','video-upscale');
      query.set('resolution',chosen('resolution','1080p'));
      query.set('mode',inputValue('[name="mode"]','general'));
    }else if(tool==='product-photo'){
      query.set('workflow','product-photo');
      var prompt=inputValue('[name="prompt"]','');
      if(prompt) query.set('prompt',prompt);
      query.set('ratio',chosen('ratio','1:1'));
      query.set('outputs',inputValue('[name="outputs"]','4'));
    }else if(tool==='extender'){
      query.set('workflow','video-extender');
      var extensionDuration=chosen('duration','5s');
      query.set('duration',extensionDuration);
      if(extensionMeta) extensionMeta.textContent='Original + '+extensionDuration+' continuation';
      query.set('remove_watermark',removeWatermark&&removeWatermark.checked?'true':'false');
      var extensionPrompt=inputValue('[name="prompt"]','');
      if(extensionPrompt) query.set('prompt',extensionPrompt);
    }else if(tool==='background-remover'){
      query.set('workflow','background-remover');
      query.set('format','png');
    }else{
      query.set('workflow','video-face-swap');
      query.set('face_enhance',faceEnhance&&faceEnhance.checked?'true':'false');
    }
    document.querySelectorAll('[data-api-link]').forEach(function(link){link.href='api.html?'+query.toString();});
  }

  function setStatus(name,text){
    if(!status)return;status.className='status-pill '+name;
    if(statusText)statusText.textContent=text;
  }
  function mediaNode(key){
    var data=files[key];if(!data)return null;
    var media=document.createElement(data.file.type.indexOf('video/')===0?'video':'img');media.src=data.url;
    if(media.tagName==='VIDEO'){media.controls=true;media.playsInline=true;media.muted=true;}
    return media;
  }
  function showResult(){
    if(empty)empty.style.display='none';
    if(tool==='product-photo'){
      if(imageGrid){imageGrid.style.display='grid';imageGrid.querySelectorAll('.image-result').forEach(function(card){card.querySelectorAll('img').forEach(function(img){img.remove();});var img=mediaNode('product');if(img)card.appendChild(img);});}
    }else{
      if(compare){compare.style.display='grid';var key=tool==='upscaler'||tool==='extender'?'video':(tool==='background-remover'?'image':'target');compare.querySelectorAll('[data-result-media]').forEach(function(box){box.querySelectorAll('video,img').forEach(function(x){x.remove();});var media=mediaNode(key);if(media)box.appendChild(media);});}
    }
    var watermark=document.querySelector('[data-demo-watermark]');
    if(watermark) watermark.style.display=removeWatermark&&removeWatermark.checked?'none':'block';
    if(actions)actions.style.display='flex';
  }
  function process(){
    if(run.disabled)return;
    run.disabled=true;run.innerHTML='<i class="ti ti-loader-2 spin"></i> Creating task…';
    if(progress)progress.style.display='block';
    if(actions)actions.style.display='none';
    if(compare)compare.style.display='none';if(imageGrid)imageGrid.style.display='none';if(empty)empty.style.display='flex';
    setStatus('processing','Uploading');
    var points=[{p:18,t:'Uploading inputs'},{p:42,t:'Queued'},{p:70,t:'Processing'},{p:92,t:'Finalizing'},{p:100,t:'Completed'}];
    var i=0;function next(){var step=points[i++];if(progressBar)progressBar.style.width=step.p+'%';if(progressText)progressText.textContent=step.t;if(statusText)statusText.textContent=step.t;
      if(step.p===100){setStatus('done','Completed');showResult();run.disabled=false;run.innerHTML='<i class="ti ti-refresh"></i> Create another';return;}
      setTimeout(next,560);
    }next();
  }
  if(run)run.addEventListener('click',process);
  document.querySelectorAll('[data-download]').forEach(function(btn){btn.addEventListener('click',function(){toast('Demo result is ready for download');});});
  document.querySelectorAll('[data-copy-url]').forEach(function(btn){btn.addEventListener('click',function(){var ext=tool==='product-photo'||tool==='background-remover'?'png':'mp4';navigator.clipboard&&navigator.clipboard.writeText('https://cdn.vidport.ai/tasks/demo/output.'+ext);toast('Output URL copied');});});
  updateApiLinks();requiredReady();
})();

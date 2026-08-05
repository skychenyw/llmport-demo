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
  var apiPanel=document.querySelector('[data-api-panel]');
  var previewPanel=document.querySelector('[data-preview-panel]');
  var apiCode=document.querySelector('[data-api-code]');
  var isRunning=false, isComplete=false;

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
    if(consent && !consent.checked) ok=false;
    if(run) run.disabled=!ok;
    updateApi();
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
      choice.classList.add('on');updateApi();
    });
  });
  document.querySelectorAll('select,textarea,input[type="text"]').forEach(function(el){el.addEventListener('input',updateApi);});
  if(consent) consent.addEventListener('change',requiredReady);

  function chosen(name,fallback){
    var el=document.querySelector('[data-choice-group="'+name+'"] .on');
    return el?el.getAttribute('data-choice'):fallback;
  }
  function inputValue(sel,fallback){var el=document.querySelector(sel);return el&&el.value?el.value:fallback;}
  function filename(key){return files[key]?files[key].file.name:'<upload_required>';}
  function payload(){
    if(tool==='upscaler') return {model:'vidport/video-upscale',input:{video:filename('video')},parameters:{output_resolution:chosen('resolution','1080p'),enhancement_mode:inputValue('[name="mode"]','general'),preserve_fps:true}};
    if(tool==='product-photo') return {model:'vidport/product-photo',input:{image:filename('product')},parameters:{scene:chosen('scene','studio'),aspect_ratio:chosen('ratio','1:1'),num_outputs:Number(inputValue('[name="outputs"]','4')),prompt:inputValue('[name="prompt"]','')}};
    return {model:'vidport/video-face-swap',input:{face_image:filename('face'),target_video:filename('target')},parameters:{face_index:Number(inputValue('[name="face_index"]','0')),quality:chosen('quality','standard'),preserve_audio:true},consent_confirmed:!!(consent&&consent.checked)};
  }
  function updateApi(){
    if(!apiCode)return;
    var body=JSON.stringify(payload(),null,2);
    apiCode.textContent="curl -X POST https://api.vidport.ai/v1/tasks \\\n  -H \"Authorization: Bearer $VIDPORT_API_KEY\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '"+body+"'";
  }

  document.querySelectorAll('[data-workspace-tab]').forEach(function(tab){
    tab.addEventListener('click',function(){
      document.querySelectorAll('[data-workspace-tab]').forEach(function(x){x.classList.remove('on');});tab.classList.add('on');
      var api=tab.getAttribute('data-workspace-tab')==='api';
      if(apiPanel)apiPanel.style.display=api?'block':'none';
      if(previewPanel)previewPanel.style.display=api?'none':'flex';
      if(progress)progress.style.display=api?'none':(isRunning||isComplete?'block':'none');
      if(actions)actions.style.display=api?'none':(isComplete?'flex':'none');
    });
  });

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
      if(compare){compare.style.display='grid';var key=tool==='upscaler'?'video':'target';compare.querySelectorAll('[data-result-media]').forEach(function(box){box.querySelectorAll('video,img').forEach(function(x){x.remove();});var media=mediaNode(key);if(media)box.appendChild(media);});}
    }
    if(actions)actions.style.display='flex';
  }
  function process(){
    if(run.disabled)return;
    isRunning=true;isComplete=false;
    run.disabled=true;run.innerHTML='<i class="ti ti-loader-2 spin"></i> Creating task…';
    if(progress)progress.style.display='block';
    if(actions)actions.style.display='none';
    if(compare)compare.style.display='none';if(imageGrid)imageGrid.style.display='none';if(empty)empty.style.display='flex';
    setStatus('processing','Uploading');
    var points=[{p:18,t:'Uploading inputs'},{p:42,t:'Queued'},{p:70,t:'Processing'},{p:92,t:'Finalizing'},{p:100,t:'Completed'}];
    var i=0;function next(){var step=points[i++];if(progressBar)progressBar.style.width=step.p+'%';if(progressText)progressText.textContent=step.t;if(statusText)statusText.textContent=step.t;
      if(step.p===100){isRunning=false;isComplete=true;setStatus('done','Completed');showResult();run.disabled=false;run.innerHTML='<i class="ti ti-refresh"></i> Create another';return;}
      setTimeout(next,560);
    }next();
  }
  if(run)run.addEventListener('click',process);
  document.querySelectorAll('[data-copy-api]').forEach(function(btn){btn.addEventListener('click',function(){navigator.clipboard&&navigator.clipboard.writeText(apiCode.textContent);toast('API request copied');});});
  document.querySelectorAll('[data-download]').forEach(function(btn){btn.addEventListener('click',function(){toast('Demo result is ready for download');});});
  document.querySelectorAll('[data-copy-url]').forEach(function(btn){btn.addEventListener('click',function(){navigator.clipboard&&navigator.clipboard.writeText('https://cdn.vidport.ai/tasks/demo/output.mp4');toast('Output URL copied');});});
  updateApi();requiredReady();
})();

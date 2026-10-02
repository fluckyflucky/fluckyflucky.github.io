import urllib.request,urllib.parse,json,time,pathlib,concurrent.futures
jobs=[('transit_health','https://api.transit.ls8h.com/api/health',None),('transit_suggest','https://api.transit.ls8h.com/api/v1/places/suggest?'+urllib.parse.urlencode({'q':'東京駅'}),None),('transit_plan','https://api.transit.ls8h.com/api/v1/plan?'+urllib.parse.urlencode({'from':'geo:35.681,139.767','to':'geo:35.690,139.700'}),None),('transit_feeds','https://api.transit.ls8h.com/api/v1/feeds',None),('seasons_forecast','https://seasons.kooexperience.com/api/sakura/forecast',None),('seasons_mcp','https://seasons.kooexperience.com/mcp',{'jsonrpc':'2.0','id':1,'method':'initialize','params':{'protocolVersion':'2024-11-05','capabilities':{},'clientInfo':{'name':'provider-audit','version':'1.0'}}}),('transfer_mcp','https://japan-transfer-mcp-server.kawaii-cute.workers.dev/mcp',{'jsonrpc':'2.0','id':1,'method':'initialize','params':{'protocolVersion':'2024-11-05','capabilities':{},'clientInfo':{'name':'provider-audit','version':'1.0'}}})]
def run(j):
 name,url,body=j;t=time.monotonic();r={'name':name,'url':url,'method':'POST' if body else 'GET'}
 try:
  req=urllib.request.Request(url,data=json.dumps(body).encode() if body else None,headers={'User-Agent':'TravelProviderAudit/1.0','Content-Type':'application/json','Accept':'application/json, text/event-stream'})
  with urllib.request.urlopen(req,timeout=25) as res:
   raw=res.read(1500000).decode(errors='replace');r.update(status=res.status,content_type=res.headers.get('Content-Type'),body=raw)
 except Exception as e:r['error']=str(e)
 r['seconds']=round(time.monotonic()-t,2);return r
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
 results=list(ex.map(run,jobs))
pathlib.Path(str(pathlib.Path(__file__).with_name('公开接口复测结果.json'))).write_text(json.dumps(results,ensure_ascii=False,indent=2))
for r in results:
 print(json.dumps({**r,'body':r.get('body','')[:2200]},ensure_ascii=False))

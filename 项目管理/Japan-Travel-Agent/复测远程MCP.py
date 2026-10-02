import urllib.request,json,pathlib,concurrent.futures
urls={'seasons':'https://seasons.kooexperience.com/mcp','transfer':'https://japan-transfer-mcp-server.kawaii-cute.workers.dev/mcp'}
def run(item):
 name,url=item;headers={'User-Agent':'TravelProviderAudit/1.0','Content-Type':'application/json','Accept':'application/json, text/event-stream'};out=[]
 def req(method,params,id):
  body={'jsonrpc':'2.0','method':method,'params':params}
  if id is not None:body['id']=id
  r={'server':name,'method':method}
  try:
   with urllib.request.urlopen(urllib.request.Request(url,data=json.dumps(body).encode(),headers=headers),timeout=25) as res:
    if res.headers.get('mcp-session-id'):headers['Mcp-Session-Id']=res.headers.get('mcp-session-id')
    r.update(status=res.status,body=res.read(500000).decode())
  except Exception as e:r['error']=str(e)
  out.append(r);return r
 req('initialize',{'protocolVersion':'2024-11-05','capabilities':{},'clientInfo':{'name':'provider-audit','version':'1.0'}},1)
 req('notifications/initialized',{},None)
 r=req('tools/list',{},2)
 if r.get('status')==200:
  args={'name':'festivals_list','arguments':{'month':10}} if name=='seasons' else {'name':'search_station_by_name','arguments':{'query':'東京','onlyName':True}}
  req('tools/call',args,3)
 return out
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:rs=sum(list(ex.map(run,urls.items())),[])
pathlib.Path(str(pathlib.Path(__file__).with_name('远程MCP复测结果.json'))).write_text(json.dumps(rs,ensure_ascii=False,indent=2))
for r in rs:
 b=r.get('body','')
 if r['method']=='tools/list' and r.get('status')==200:
  try:
   j=json.loads(next(l[6:] for l in b.splitlines() if l.startswith('data: '))) if b.startswith('event:') else json.loads(b);b=str([t['name'] for t in j['result']['tools']])
  except:pass
 print(r['server'],r['method'],r.get('status'),r.get('error'),b[:2000])

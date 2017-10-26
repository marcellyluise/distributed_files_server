var oData = {
    myIP: '0',
    files: []
}


oData['files'].push({ path: ['dir1','dir2'], name:'arq.txt', file_length: 6, bin: '012345', owner: 'claiton' });
oData['files'].push({ path: [], name:'arq1.txt', bin: '1012345', file_length: 7, owner: 'claiton' });
oData['files'].push({ path: ['dir1'], name:'arq2.txt', bin: '012345', file_length: 7, owner: 'claiton' });
oData['files'].push({ path: ['dir1','dir3'], name:'arq3.txt', bin: '012345', file_length: 7, owner: 'claiton' });

console.log(oData);

exports.oData=oData;
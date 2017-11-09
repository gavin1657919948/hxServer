var args_input=require('../facility.input.interface')

var efData=require('../../config/ef-data.json');
module.exports=function(Facility){
    //inputData接口:
    Facility.inputData=function(){
    console.log("Enter Facility.inputData Function...");  
       for(var i=0;i<args.length;i++){
            var name=args[i].arg;
            var val=arguments[i];
           if(name=="organizationId")
           var organizationId=val;
           if(name=="facilityId")
           var facilityId=val;
           if(name=="fuelName")
           var fuelName=val;
           if(name=="deviceType")
           var deviceType=val;
           if(name=="power")
           var power=val;
           if(name=="ash")
           var ash=val;
           if(name=="sul")
           var sul=val;
           if(name=="cost")
           var cost=val; 
       }
       var arr_ash=ash.replace(/"/g,'').replace('[','').replace(']','').split(',');
       var arr_sul=sul.replace(/"/g,'').replace('[','').replace(']','').split(',');
       var arr_cost=cost.replace(/"/g,'').replace('[','').replace(']','').split(',');
       var status=getStatus(fuelName,power);
       console.log("helperColumn:",status+fuelName+deviceType);
       try{
              var ef_nox=efData[status+fuelName+deviceType]['nox'];
              var ef_co=efData[status+fuelName+deviceType]['co'];
              var ef_sox=efData[status+fuelName+deviceType]['sox'];
              var ef_pm2_5=efData[status+fuelName+deviceType]['pm2_5'];
              var ef_pm10=efData[status+fuelName+deviceType]['pm10'];
              var ef_filterabletpm=efData[status+fuelName+deviceType]['filterabletpm'];
              var ef_condensiblepm=efData[status+fuelName+deviceType]['condensiblepm'];
            }catch(err){
                console.error("查询ef值时出错,原因可能为:不存在对应的ef值",err);
            }
       if(typeof ef_nox=='undefined'){
           this.call(arguments[arguments.length-1](null,"cannotFindEF"));
            return;
       }
       console.log("EF==>ef_nox:"+ef_nox+";ef_co:"+ef_co+";ef_sox:"+ef_sox+";ef_pm2_5:"+ef_pm2_5+";ef_pm10:"+ef_pm10+";ef_filterabletpm:"+ef_filterabletpm+";ef_condensiblepm:"+ef_condensiblepm);
        for(var k=0;k<12;k++){
            if(fuelName=="一号燃料油"||fuelName=="二号燃料油"||fuelName=="四号燃料油"){
               arr_cost[k]= arr_cost[k]*(1000/859);
            }else if(fuelName=="五号燃料油"||fuelName=="六号燃料油"||fuelName=="七号燃料油"){
                arr_cost[k]=arr_cost[k]*(1000/945.6);
            }
        }
        var emission_NOx=0;
        var emission_CO=0;
        var emission_SOx=0;
        var emission_PM2_5=0;
        var emission_PM10=0;
        var emission_FTPM=0;
        var emission_CPM=0;
        var emission_TPM=0;
        for(var m=0;m<12;m++){
            emission_NOx=emission_NOx+arr_cost[m]*ef_nox;
            emission_CO+=arr_cost[m]*ef_co;
            if(fuelName!="天然气"){
                emission_SOx+=arr_cost[m]*ef_sox*arr_sul[m];
            }else{
                emission_SOx+=arr_cost[m]*ef_sox;
            }
            if(fuelName!="烟煤"&&fuelName!="次烟煤"&&fuelName!="无烟煤"&&fuelName!="褐煤"&&deviceType!="固态排渣对冲式煤粉锅炉-两至三个独立燃烧器"&&deviceType!="固态排渣切向燃烧式煤粉锅炉"&&deviceType!="固态排渣墙式煤粉锅炉"&&deviceType!="液态排渣墙式煤粉锅炉"&&deviceType!="旋风式锅炉"&&deviceType!="煤粉锅炉"){
                emission_PM2_5+=arr_cost[m]*ef_pm2_5;
                emission_PM10+=arr_cost[m]*ef_pm10;
            }else{
                emission_PM2_5+=arr_cost[m]*ef_pm2_5*arr_ash[m];
                emission_PM10+=arr_cost[m]*ef_pm10*arr_ash[m];
            }
            if(fuelName!="无烟煤"&&fuelName!="褐煤"&&fuelName!="七号燃料油"&&fuelName!="六号燃料油"&&deviceType!="固态排渣对冲式煤粉锅炉-两至三个独立燃烧器"&&deviceType!="固态排渣切向燃烧式煤粉锅炉"&&deviceType!="固态排渣墙式煤粉锅炉"&&deviceType!="液态排渣墙式煤粉锅炉"&&deviceType!="旋风式锅炉"&&deviceType!="煤粉锅炉"){
                emission_FTPM+=arr_cost[m]*ef_filterabletpm;
            }else if((fuelName=="六号燃料油"||fuelName=="七号燃料油")&&ef_filterabletpm!=0){
                emission_FTPM+=arr_cost[m]*(ef_filterabletpm*arr_sul[m]+3.22);
            }else{
                emission_FTPM+=arr_cost[m]*ef_filterabletpm*arr_ash[m];
            }
            if(fuelName=="无烟煤"){
                emission_CPM+=arr_cost[m]*ef_condensiblepm*arr_ash[m];
            }else{
                emission_CPM+=arr_cost[m]*ef_condensiblepm;
            }
        }
        emission_TPM=emission_FTPM+emission_CPM;
       console.log("total:"+"NOx="+emission_NOx+";SOx="+emission_SOx+";CO="+emission_CO+";TPM="+emission_TPM+";emission_FTPM:"+emission_FTPM+";emission_CPM:"+emission_CPM+";arr_cost[0]"+arr_cost[0]);  

       Facility.find({"where":{"organizationId":organizationId,"facilityId":facilityId}}, function(err, emission) {
                if (err){
                    console.log("find Error:",err);
                    throw err;
                }
                if(emission.length>0){
                    console.log("更新数据");
                    Facility.update(
                        { "facilityId": facilityId,"organizationId":organizationId},{ "nox": emission_NOx,"sox":emission_SOx,"co":emission_CO,"tpm":emission_TPM,"pm2_5":emission_PM2_5,"pm10":emission_PM10,"ftpm":emission_FTPM,"cpm":emission_CPM}
                      , function (err, result) {
                        if (err) {
                            console.log("updateFacility Error",err);
                            throw err;
                        }
                        console.log('updateFacility Success:', result);
                    })
                    
                 }
                else{
                    console.log("新建数据");
                    Facility.create(
                        [{ "facilityId": facilityId, "nox": emission_NOx,"sox":emission_SOx,"co":emission_CO,"tpm":emission_TPM,"pm2_5":emission_PM2_5,"pm10":emission_PM10,"ftpm":emission_FTPM,"cpm":emission_CPM,"organizationId":organizationId}]
                      , function (err, emission) {
                        if (err) {
                            console.log("createFacility Error",err);
                            throw err;
                        }
                        console.log('createFacility success:', emission);
                    })
                }
            
         });   
        
        this.call(arguments[arguments.length-1](null,"saveSuccess"));
    }
    Facility.remoteMethod(
        'inputData',{
            accepts: args_input,
            returns:{
                arg:'result',
                type:'string'
            },
            description:["calculate and save the facilities emission data"]
        }
    )

    //queryData接口:
    Facility.queryData=function(organizationId,cb){
        console.log("Enter Facility queryData Function...");
        Facility.find({"where":{"organizationId":organizationId},"fields":{id:false,organizationId:false,pm2_5:false,pm10:false,ftpm:false,cpm:false}}, function(err, emission) {
            if(err) throw err;
            cb(null,emission);
        })
    }
    Facility.remoteMethod(
        'queryData',{
            accepts:{
                arg:"organizationId",
                type:"string"
            },
            returns:{
                arg:'result',
                type:'json'
            },
            description:["query the facilities emission totalData"]
        }
    )

    //clearData接口:(重置该用户的计算器)
    Facility.clearData=function(organizationId,cb){
        console.log("Enter Facility clearData Function...");
        Facility.deleteAll({"where":{"organizationId":organizationId}},function(err,result){
            if(err){
                console.log(err);
                throw err;
            }
            console.log("clearData:",result);
            cb(null,"clearSuccess");
        })
    }

    Facility.remoteMethod(
        'clearData',{
            accepts:{
                arg:"organizationId",
                type:"string"
            },
            returns:{
                arg:'result',
                type:'string'
            },
            description:["clear the facilities emission Data belongs to organization"]
        }
    )
     //查询状态编号  
     function getStatus(fuelName,power){
        if(fuelName=="烟煤"||fuelName=="次烟煤"||fuelName=="无烟煤"||fuelName=="褐煤"){
            if(power>=73){
                return 2;
            }else{
                return 1;
            }
        }else if(fuelName=="天然气"){
            if(power>=73){
                return 2;
            }
            else if(power<=29){
                return 3
            }
            return 4;
        }else{
            if(power<=29)
            return 3;
            return 4;
        }
    };
}

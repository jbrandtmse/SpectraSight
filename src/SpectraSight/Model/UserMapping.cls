Class SpectraSight.Model.UserMapping Extends (%Persistent, %JSON.Adaptor)
{

Property IrisUsername As %String(%JSONFIELDNAME = "irisUsername", MAXLEN = 128) [ Required ];

Property DisplayName As %String(%JSONFIELDNAME = "displayName", MAXLEN = 255) [ Required ];

Property IsActive As %Boolean(%JSONFIELDNAME = "isActive") [ InitialExpression = 1 ];

Property CreatedAt As %TimeStamp(%JSONFIELDNAME = "createdAt");

Property UpdatedAt As %TimeStamp(%JSONFIELDNAME = "updatedAt");

Index UsernameIdx On IrisUsername [ Unique ];

Method %OnNew(initvalue As %String = "") As %Status
{
    Set tSC = $$$OK
    Try {
        Set ..CreatedAt = $ZDATETIME($ZTIMESTAMP, 3, 1)
        Set ..UpdatedAt = ..CreatedAt
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

Method %OnBeforeSave(insert As %Boolean) As %Status
{
    Set tSC = $$$OK
    Try {
        Set ..UpdatedAt = $ZDATETIME($ZTIMESTAMP, 3, 1)
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

Storage Default
{
<Data name="UserMappingDefaultData">
<Value name="1">
<Value>%%CLASSNAME</Value>
</Value>
<Value name="2">
<Value>IrisUsername</Value>
</Value>
<Value name="3">
<Value>DisplayName</Value>
</Value>
<Value name="4">
<Value>IsActive</Value>
</Value>
<Value name="5">
<Value>CreatedAt</Value>
</Value>
<Value name="6">
<Value>UpdatedAt</Value>
</Value>
</Data>
<DataLocation>^SpectraSight.Mod80.UserMappingD</DataLocation>
<DefaultData>UserMappingDefaultData</DefaultData>
<IdLocation>^SpectraSight.Mod80.UserMappingD</IdLocation>
<IndexLocation>^SpectraSight.Mod80.UserMappingI</IndexLocation>
<StreamLocation>^SpectraSight.Mod80.UserMappingS</StreamLocation>
<Type>%Storage.Persistent</Type>
}

}

Class SpectraSight.Model.Project Extends (%Persistent, %JSON.Adaptor)
{

Property Name As %String(%JSONFIELDNAME = "name", MAXLEN = 255) [ Required ];

Property Prefix As %String(%JSONFIELDNAME = "prefix", MAXLEN = 10) [ Required ];

Property Owner As %String(%JSONFIELDNAME = "owner", MAXLEN = 255);

Property SequenceCounter As %Integer(%JSONFIELDNAME = "sequenceCounter") [ InitialExpression = 0 ];

Property CreatedAt As %TimeStamp(%JSONFIELDNAME = "createdAt");

Property UpdatedAt As %TimeStamp(%JSONFIELDNAME = "updatedAt");

Index PrefixIdx On Prefix [ Unique ];

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
        // Validate prefix: uppercase alphanumeric, 2-10 characters
        Set tLen = $LENGTH(..Prefix)
        If (tLen < 2) || (tLen > 10) {
            Set tSC = $$$ERROR($$$GeneralError, "Prefix must be 2-10 characters")
        } ElseIf (..Prefix '= $ZCONVERT(..Prefix, "U")) {
            Set tSC = $$$ERROR($$$GeneralError, "Prefix must be uppercase")
        } ElseIf ($TRANSLATE(..Prefix, "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") '= "") {
            Set tSC = $$$ERROR($$$GeneralError, "Prefix must be uppercase alphanumeric (A-Z, 0-9)")
        }
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

Storage Default
{
<Data name="ProjectDefaultData">
<Value name="1">
<Value>%%CLASSNAME</Value>
</Value>
<Value name="2">
<Value>Name</Value>
</Value>
<Value name="3">
<Value>Prefix</Value>
</Value>
<Value name="4">
<Value>Owner</Value>
</Value>
<Value name="5">
<Value>SequenceCounter</Value>
</Value>
<Value name="6">
<Value>CreatedAt</Value>
</Value>
<Value name="7">
<Value>UpdatedAt</Value>
</Value>
</Data>
<DataLocation>^SpectraSight.Model.ProjectD</DataLocation>
<DefaultData>ProjectDefaultData</DefaultData>
<IdLocation>^SpectraSight.Model.ProjectD</IdLocation>
<IndexLocation>^SpectraSight.Model.ProjectI</IndexLocation>
<StreamLocation>^SpectraSight.Model.ProjectS</StreamLocation>
<Type>%Storage.Persistent</Type>
}

}

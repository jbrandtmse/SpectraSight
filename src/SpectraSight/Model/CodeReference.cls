Class SpectraSight.Model.CodeReference Extends (%Persistent, %JSON.Adaptor)
{

Property Ticket As SpectraSight.Model.Ticket(%JSONFIELDNAME = "ticketId") [ Required ];

Property ClassName As %String(%JSONFIELDNAME = "className", MAXLEN = 500) [ Required ];

Property MethodName As %String(%JSONFIELDNAME = "methodName", MAXLEN = 255);

Property AddedBy As %String(%JSONFIELDNAME = "addedBy", MAXLEN = 255);

Property Timestamp As %TimeStamp(%JSONFIELDNAME = "timestamp");

Index TicketIdx On Ticket;

Index ClassNameIdx On ClassName;

Method %OnNew(initvalue As %String = "") As %Status
{
    Set tSC = $$$OK
    Try {
        Set ..Timestamp = $ZDATETIME($ZTIMESTAMP, 3, 1)
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

Storage Default
{
<Data name="CodeReferenceDefaultData">
<Value name="1">
<Value>%%CLASSNAME</Value>
</Value>
<Value name="2">
<Value>Ticket</Value>
</Value>
<Value name="3">
<Value>ClassName</Value>
</Value>
<Value name="4">
<Value>MethodName</Value>
</Value>
<Value name="5">
<Value>AddedBy</Value>
</Value>
<Value name="6">
<Value>Timestamp</Value>
</Value>
</Data>
<DataLocation>^SpectraSight.M80.CodeReferenceD</DataLocation>
<DefaultData>CodeReferenceDefaultData</DefaultData>
<IdLocation>^SpectraSight.M80.CodeReferenceD</IdLocation>
<IndexLocation>^SpectraSight.M80.CodeReferenceI</IndexLocation>
<StreamLocation>^SpectraSight.M80.CodeReferenceS</StreamLocation>
<Type>%Storage.Persistent</Type>
}

}
